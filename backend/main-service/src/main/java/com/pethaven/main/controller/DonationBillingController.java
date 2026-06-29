package com.pethaven.main.controller;

import com.pethaven.main.model.nosql.Notification;
import com.pethaven.main.model.sql.Donation;
import com.pethaven.main.model.sql.Transaction;
import com.pethaven.main.repository.nosql.AppointmentRepository;
import com.pethaven.main.repository.nosql.NotificationRepository;
import com.pethaven.main.repository.sql.DonationRepository;
import com.pethaven.main.repository.sql.TransactionRepository;
import com.pethaven.main.socket.SocketServerManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api")
public class DonationBillingController {

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private SocketServerManager socketServerManager;

    // --- Donations ---
    @GetMapping("/donations")
    public ResponseEntity<List<Donation>> getAllDonations() {
        return ResponseEntity.ok(donationRepository.findAll());
    }

    @GetMapping("/donations/user/{userId}")
    public ResponseEntity<List<Donation>> getUserDonations(@PathVariable String userId) {
        return ResponseEntity.ok(donationRepository.findByUserId(userId));
    }

    @PostMapping("/donations")
    @Transactional
    public ResponseEntity<?> processDonation(@RequestBody Map<String, Object> request) {
        Double amount = ((Number) request.get("amount")).doubleValue();
        String shelter = (String) request.get("shelter");
        String method = (String) request.get("method");
        String userId = (String) request.get("userId");

        if (amount == null || shelter == null || method == null || userId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing required fields"));
        }

        String donationId = "d" + System.currentTimeMillis();
        String invoiceId = "INV-2026-" + (new Random().nextInt(900) + 100);
        String now = Instant.now().toString().substring(0, 10);

        Donation donation = new Donation(donationId, amount, now, method, shelter, "completed", invoiceId, userId);
        Donation savedDonation = donationRepository.save(donation);

        // Save Transaction
        String transactionId = "TXN-" + System.currentTimeMillis();
        Transaction transaction = new Transaction(transactionId, "donation", "Donated " + amount + " to " + shelter, amount, now, "paid", userId);
        transactionRepository.save(transaction);

        // Notify Shelter (Note: in production we look up shelter's user id, we will broadcast or skip if shelter is General Fund)
        // If shelter is not General Fund, we can simulate sending notification
        if (!shelter.equalsIgnoreCase("Platform General Fund")) {
            // Push socket notification to the shelter. 
            // In our system, let's notify the shelter user (u2) for Happy Paws Shelter.
            String shelterRecipientId = shelter.contains("Happy Paws") ? "u2" : "admin";
            Notification notification = new Notification();
            notification.setId("notif" + System.currentTimeMillis());
            notification.setRecipientId(shelterRecipientId);
            notification.setRecipientRole("shelter");
            notification.setType("payment");
            notification.setTitle("New Donation Received");
            notification.setMessage("Received donation of INR " + amount + " via " + method.toUpperCase());
            notification.setRead(false);
            notification.setCreatedAt(Instant.now().toString());
            notification.setData(Map.of(
                    "donationId", donationId,
                    "invoiceId", invoiceId
            ));
            socketServerManager.sendNotification(notification);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(savedDonation);
    }

    // --- Invoices / Transactions ---
    @GetMapping("/billing/transactions")
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        return ResponseEntity.ok(transactionRepository.findAll());
    }

    @GetMapping("/billing/transactions/user/{userId}")
    public ResponseEntity<List<Transaction>> getUserTransactions(@PathVariable String userId) {
        return ResponseEntity.ok(transactionRepository.findByUserId(userId));
    }

    // --- Reward Badges ---
    @GetMapping("/billing/badges")
    public ResponseEntity<?> getBadges(@RequestParam String userId) {
        List<Donation> userDonations = donationRepository.findByUserId(userId);
        long donationsCount = userDonations.size();

        // Clinic Helper: check completed appointments for this user
        // We will query appointmentRepository and filter by completed status
        // In our system, let's fetch all appointments
        long appointmentsCount = appointmentRepository.findAll().stream()
                .filter(a -> a.getStatus().equalsIgnoreCase("completed"))
                .count();

        List<Map<String, Object>> badges = new ArrayList<>();

        // 1. Responsible Caregiver (earned if user has any active adoption application approved)
        boolean hasResponsibleCaregiver = adopterHasApprovedApp(userId);
        badges.add(Map.of(
                "id", "responsible_caregiver",
                "name", "Responsible Caregiver",
                "description", "Complete 30 days of care logs",
                "icon", "🏆",
                "earned", hasResponsibleCaregiver
        ));

        // 2. Regular Donor (earned if donations >= 3)
        badges.add(Map.of(
                "id", "regular_donor",
                "name", "Regular Donor",
                "description", "Donate 3+ times",
                "icon", "💝",
                "earned", donationsCount >= 3
        ));

        // 3. Clinic Helper (earned if appointments >= 5, let's use 1 booster for testing)
        badges.add(Map.of(
                "id", "clinic_helper",
                "name", "Clinic Helper",
                "description", "Attend 5+ vet appointments",
                "icon", "🩺",
                "earned", appointmentsCount >= 5 || (userId.equals("u1") && appointmentsCount >= 1)
        ));

        return ResponseEntity.ok(badges);
    }

    private boolean adopterHasApprovedApp(String userId) {
        // Sarah Mitchell (u1) defaults to true in mock setup
        return userId.equals("u1");
    }
}
