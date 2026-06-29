package com.pethaven.main.controller;

import com.pethaven.main.model.nosql.Appointment;
import com.pethaven.main.model.nosql.Notification;
import com.pethaven.main.repository.nosql.AppointmentRepository;
import com.pethaven.main.socket.SocketServerManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private SocketServerManager socketServerManager;

    @GetMapping
    public ResponseEntity<List<Appointment>> getAll(
            @RequestParam(required = false) String vetId,
            @RequestParam(required = false) String adopterId,
            @RequestParam(required = false) String status) {

        List<Appointment> appointments = appointmentRepository.findAll();

        if (vetId != null && !vetId.isEmpty()) {
            appointments = appointments.stream().filter(a -> a.getVetId().equals(vetId)).collect(Collectors.toList());
        }
        if (adopterId != null && !adopterId.isEmpty()) {
            appointments = appointments.stream().filter(a -> adopterId.equals(a.getAdopterId())).collect(Collectors.toList());
        }
        if (status != null && !status.isEmpty()) {
            appointments = appointments.stream().filter(a -> a.getStatus().equalsIgnoreCase(status)).collect(Collectors.toList());
        }

        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        Optional<Appointment> aptOpt = appointmentRepository.findById(id);
        if (aptOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Appointment not found"));
        }
        return ResponseEntity.ok(aptOpt.get());
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADOPTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> create(@RequestBody Appointment apt) {
        if (apt.getPetId() == null || apt.getVetId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing petId or vetId"));
        }

        apt.setId("apt" + System.currentTimeMillis());
        if (apt.getStatus() == null) {
            apt.setStatus("pending");
        }

        Appointment saved = appointmentRepository.save(apt);

        // Notify Vet (recipientId = vetId)
        Notification notification = new Notification();
        notification.setId("notif" + System.currentTimeMillis());
        notification.setRecipientId(apt.getVetId());
        notification.setRecipientRole("veterinarian");
        notification.setType("appointment");
        notification.setTitle("New Vet Appointment Booking");
        notification.setMessage("An adopter booked an appointment for " + apt.getPetName() + " on " + apt.getDate() + " at " + apt.getTime());
        notification.setRead(false);
        notification.setCreatedAt(Instant.now().toString());
        notification.setData(Map.of(
                "appointmentId", saved.getId(),
                "petName", apt.getPetName()
        ));
        socketServerManager.sendNotification(notification);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ROLE_VET') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");
        String notes = request.get("notes");
        String adopterId = request.get("adopterId"); // Adopter ID is sent to push notification

        if (status == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing status value"));
        }

        Optional<Appointment> aptOpt = appointmentRepository.findById(id);
        if (aptOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Appointment not found"));
        }

        Appointment apt = aptOpt.get();
        apt.setStatus(status);
        if (notes != null) {
            apt.setNotes(notes);
        }
        Appointment saved = appointmentRepository.save(apt);

        // Notify Adopter (recipientId = adopterId or query from applications, here the client passes adopterId)
        String recipientAdopterId = (adopterId != null && !adopterId.isEmpty()) ? adopterId : apt.getAdopterId();
        if (recipientAdopterId != null && !recipientAdopterId.isEmpty()) {
            Notification notification = new Notification();
            notification.setId("notif" + System.currentTimeMillis());
            notification.setRecipientId(recipientAdopterId);
            notification.setRecipientRole("adopter");
            notification.setType("appointment");
            notification.setTitle("Appointment Status Updated");
            notification.setMessage(apt.getVetName() + " has updated your appointment for " + apt.getPetName() + " to: " + status);
            notification.setRead(false);
            notification.setCreatedAt(Instant.now().toString());
            notification.setData(Map.of(
                    "appointmentId", saved.getId(),
                    "status", status
            ));
            socketServerManager.sendNotification(notification);
        }

        return ResponseEntity.ok(saved);
    }
}
