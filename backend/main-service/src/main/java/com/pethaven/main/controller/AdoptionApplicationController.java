package com.pethaven.main.controller;

import com.pethaven.main.model.nosql.AdoptionApplication;
import com.pethaven.main.model.nosql.Notification;
import com.pethaven.main.model.nosql.Pet;
import com.pethaven.main.repository.nosql.AdoptionApplicationRepository;
import com.pethaven.main.repository.nosql.PetRepository;
import com.pethaven.main.socket.SocketServerManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/applications")
public class AdoptionApplicationController {

    @Autowired
    private AdoptionApplicationRepository applicationRepository;

    @Autowired
    private PetRepository petRepository;

    @Autowired
    private SocketServerManager socketServerManager;

    @GetMapping
    public ResponseEntity<List<AdoptionApplication>> getAll(
            @RequestParam(required = false) String adopterId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String shelterId) {

        List<AdoptionApplication> apps = applicationRepository.findAll();

        if (adopterId != null && !adopterId.isEmpty()) {
            apps = apps.stream().filter(a -> a.getAdopterId().equals(adopterId)).collect(Collectors.toList());
        }
        if (status != null && !status.isEmpty()) {
            apps = apps.stream().filter(a -> a.getStatus().equalsIgnoreCase(status)).collect(Collectors.toList());
        }
        if (shelterId != null && !shelterId.isEmpty()) {
            // Filter applications where pet belongs to shelterId
            apps = apps.stream().filter(a -> {
                Optional<Pet> petOpt = petRepository.findById(a.getPetId());
                return petOpt.isPresent() && petOpt.get().getShelterId().equals(shelterId);
            }).collect(Collectors.toList());
        }

        return ResponseEntity.ok(apps);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        Optional<AdoptionApplication> appOpt = applicationRepository.findById(id);
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Application not found"));
        }
        return ResponseEntity.ok(appOpt.get());
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADOPTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> create(@RequestBody AdoptionApplication app) {
        if (app.getPetId() == null || app.getAdopterId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing petId or adopterId"));
        }

        Optional<Pet> petOpt = petRepository.findById(app.getPetId());
        if (petOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Pet not found"));
        }
        Pet pet = petOpt.get();

        app.setId("app" + System.currentTimeMillis());
        app.setPetName(pet.getName());
        app.setStatus("pending");
        
        String now = Instant.now().toString();
        app.setSubmittedAt(now);
        app.setUpdatedAt(now);

        List<AdoptionApplication.TimelineEvent> events = new ArrayList<>();
        events.add(new AdoptionApplication.TimelineEvent("pending", now, "Application submitted"));
        app.setTimeline(events);

        AdoptionApplication saved = applicationRepository.save(app);

        // Notify Shelter (recipientId = pet's shelterId)
        Notification notification = new Notification();
        notification.setId("notif" + System.currentTimeMillis());
        notification.setRecipientId(pet.getShelterId());
        notification.setRecipientRole("shelter");
        notification.setType("adoption");
        notification.setTitle("New Adoption Application");
        notification.setMessage(app.getFullName() + " has submitted an application for " + pet.getName());
        notification.setRead(false);
        notification.setCreatedAt(now);
        notification.setData(Map.of(
                "applicationId", saved.getId(),
                "petName", pet.getName(),
                "petId", pet.getId()
        ));
        socketServerManager.sendNotification(notification);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ROLE_SHELTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");
        String note = request.get("note");
        String shelterName = request.get("shelterName"); // Fallback if needed

        if (status == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing status value"));
        }

        Optional<AdoptionApplication> appOpt = applicationRepository.findById(id);
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Application not found"));
        }

        AdoptionApplication app = appOpt.get();
        app.setStatus(status);
        String now = Instant.now().toString();
        app.setUpdatedAt(now);

        String noteText = note != null ? note : "Status updated to " + status;
        app.getTimeline().add(new AdoptionApplication.TimelineEvent(status, now, noteText));

        // If approved, update pet status to pending or adopted
        if (status.equalsIgnoreCase("approved")) {
            Optional<Pet> petOpt = petRepository.findById(app.getPetId());
            if (petOpt.isPresent()) {
                Pet pet = petOpt.get();
                pet.setStatus("adopted");
                petRepository.save(pet);
            }
        }

        AdoptionApplication saved = applicationRepository.save(app);

        // Notify Adopter (recipientId = app.adopterId)
        Notification notification = new Notification();
        notification.setId("notif" + System.currentTimeMillis());
        notification.setRecipientId(app.getAdopterId());
        notification.setRecipientRole("adopter");
        notification.setType("adoption");
        notification.setTitle("Application Status Updated");
        notification.setMessage((shelterName != null ? shelterName : "The shelter") + " has updated your application for " + app.getPetName() + " to: " + status);
        notification.setRead(false);
        notification.setCreatedAt(now);
        notification.setData(Map.of(
                "applicationId", saved.getId(),
                "petName", app.getPetName(),
                "status", status
        ));
        socketServerManager.sendNotification(notification);

        return ResponseEntity.ok(saved);
    }
}
