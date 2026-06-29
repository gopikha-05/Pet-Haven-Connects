package com.pethaven.main.controller;

import com.pethaven.main.model.nosql.Notification;
import com.pethaven.main.model.sql.Complaint;
import com.pethaven.main.model.sql.ComplaintTimeline;
import com.pethaven.main.repository.sql.ComplaintRepository;
import com.pethaven.main.repository.sql.ComplaintTimelineRepository;
import com.pethaven.main.socket.SocketServerManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private ComplaintTimelineRepository timelineRepository;

    @Autowired
    private SocketServerManager socketServerManager;

    @GetMapping
    public ResponseEntity<List<Complaint>> getAll(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String userRole,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority) {

        List<Complaint> complaints = complaintRepository.findAll();

        if (userId != null && userRole != null) {
            final String fUserId = userId;
            final String fUserRole = userRole.toLowerCase();

            complaints = complaints.stream().filter(c -> {
                if (fUserRole.equals("admin")) return true;
                return c.getRaisedByUserId().equals(fUserId) || c.getAgainstUserId().equals(fUserId);
            }).collect(Collectors.toList());
        }

        if (status != null && !status.isEmpty()) {
            complaints = complaints.stream().filter(c -> c.getStatus().equalsIgnoreCase(status)).collect(Collectors.toList());
        }
        if (priority != null && !priority.isEmpty()) {
            complaints = complaints.stream().filter(c -> c.getPriority().equalsIgnoreCase(priority)).collect(Collectors.toList());
        }

        // Sort by date newest first
        complaints.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        Optional<Complaint> compOpt = complaintRepository.findById(id);
        if (compOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Complaint not found"));
        }
        return ResponseEntity.ok(compOpt.get());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody Complaint complaint) {
        if (complaint.getTitle() == null || complaint.getRaisedByUserId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing required fields"));
        }

        complaint.setId("c" + System.currentTimeMillis());
        complaint.setStatus("pending");
        complaint.setResolutionNotes("");

        String now = Instant.now().toString();
        complaint.setCreatedAt(now);
        complaint.setUpdatedAt(now);

        // Save Complaint first to associate children
        Complaint saved = complaintRepository.save(complaint);

        ComplaintTimeline event = new ComplaintTimeline(saved, "pending", now, "Complaint submitted", complaint.getRaisedByName());
        timelineRepository.save(event);

        saved.setTimeline(List.of(event));
        complaintRepository.save(saved);

        // Push Socket Notification to the entity being complained against (shelter/vet)
        Notification notification = new Notification();
        notification.setId("notif" + System.currentTimeMillis());
        notification.setRecipientId(complaint.getAgainstUserId());
        notification.setRecipientRole(complaint.getAgainstRole());
        notification.setType("complaint");
        notification.setTitle("New Complaint Raised");
        notification.setMessage(complaint.getRaisedByName() + " has raised a complaint against you: " + complaint.getTitle());
        notification.setRead(false);
        notification.setCreatedAt(now);
        notification.setData(Map.of("complaintId", saved.getId()));
        socketServerManager.sendNotification(notification);

        // Also notify Admin
        Notification adminNotif = new Notification();
        adminNotif.setId("notifAdmin" + System.currentTimeMillis());
        adminNotif.setRecipientId("u4"); // Default admin user ID
        adminNotif.setRecipientRole("admin");
        adminNotif.setType("complaint");
        adminNotif.setTitle("New Complaint Registered");
        adminNotif.setMessage("A new complaint has been filed against " + complaint.getAgainstName() + " (" + complaint.getAgainstRole() + ")");
        adminNotif.setRead(false);
        adminNotif.setCreatedAt(now);
        adminNotif.setData(Map.of("complaintId", saved.getId()));
        socketServerManager.sendNotification(adminNotif);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}/status")
    @Transactional
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");
        String resolutionNotes = request.get("resolutionNotes");
        String actor = request.get("actor");
        String actorRole = request.get("actorRole");

        if (status == null || actor == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing status or actor"));
        }

        Optional<Complaint> compOpt = complaintRepository.findById(id);
        if (compOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Complaint not found"));
        }

        Complaint complaint = compOpt.get();
        complaint.setStatus(status);
        if (resolutionNotes != null) {
            complaint.setResolutionNotes(resolutionNotes);
        }
        String now = Instant.now().toString();
        complaint.setUpdatedAt(now);

        String note = resolutionNotes != null ? resolutionNotes : "Status updated to " + status;
        ComplaintTimeline timelineEvent = new ComplaintTimeline(complaint, status, now, note, actor);
        timelineRepository.save(timelineEvent);

        // We fetch the timeline list, add it, and save
        complaint.getTimeline().add(timelineEvent);
        Complaint saved = complaintRepository.save(complaint);

        // Notify Adopter about complaint status updates
        Notification notification = new Notification();
        notification.setId("notif" + System.currentTimeMillis());
        notification.setRecipientId(complaint.getRaisedByUserId());
        notification.setRecipientRole("adopter");
        notification.setType("complaint_status");
        notification.setTitle("Complaint Status Updated");
        notification.setMessage(actor + " (" + actorRole + ") has updated your complaint status to: " + status);
        notification.setRead(false);
        notification.setCreatedAt(now);
        notification.setData(Map.of(
                "complaintId", saved.getId(),
                "status", status
        ));
        socketServerManager.sendNotification(notification);

        // Notify Admin of complaint update activity
        Notification adminNotif = new Notification();
        adminNotif.setId("notifAdmin" + System.currentTimeMillis());
        adminNotif.setRecipientId("u4");
        adminNotif.setRecipientRole("admin");
        adminNotif.setType("complaint_status");
        adminNotif.setTitle("Complaint Activity");
        adminNotif.setMessage("Complaint \"" + complaint.getTitle() + "\" status has been updated to: " + status + " by " + actor);
        adminNotif.setRead(false);
        adminNotif.setCreatedAt(now);
        adminNotif.setData(Map.of("complaintId", saved.getId()));
        socketServerManager.sendNotification(adminNotif);

        return ResponseEntity.ok(saved);
    }
}
