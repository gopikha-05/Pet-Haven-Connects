package com.pethaven.main.controller;

import com.pethaven.main.model.nosql.Notification;
import com.pethaven.main.repository.nosql.NotificationRepository;
import com.pethaven.main.socket.SocketServerManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SocketServerManager socketServerManager;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            Principal principal,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {
        
        String userId = principal.getName();
        List<Notification> list = notificationRepository.findByRecipientId(userId);

        if (unreadOnly) {
            list = list.stream().filter(n -> !n.isRead()).collect(Collectors.toList());
        }

        // Sort by date newest first
        list.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return ResponseEntity.ok(list);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Principal principal) {
        String userId = principal.getName();
        long count = notificationRepository.findByRecipientIdAndIsRead(userId, false).size();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id, Principal principal) {
        Optional<Notification> notifOpt = notificationRepository.findById(id);
        if (notifOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Notification not found"));
        }
        
        Notification notif = notifOpt.get();
        if (!notif.getRecipientId().equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Unauthorized"));
        }

        notif.setRead(true);
        notificationRepository.save(notif);
        return ResponseEntity.ok(notif);
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Principal principal) {
        String userId = principal.getName();
        List<Notification> unread = notificationRepository.findByRecipientIdAndIsRead(userId, false);
        for (Notification n : unread) {
            n.setRead(true);
            notificationRepository.save(n);
        }
        return ResponseEntity.ok(Map.of("success", true, "count", unread.size()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable String id, Principal principal) {
        Optional<Notification> notifOpt = notificationRepository.findById(id);
        if (notifOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Notification not found"));
        }
        Notification notif = notifOpt.get();
        if (!notif.getRecipientId().equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Unauthorized"));
        }
        notificationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/send")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> sendNotification(@RequestBody Notification notification) {
        notification.setId("notif" + System.currentTimeMillis());
        if (notification.getCreatedAt() == null) {
            notification.setCreatedAt(Instant.now().toString());
        }
        notification.setRead(false);
        socketServerManager.sendNotification(notification);
        return ResponseEntity.status(HttpStatus.CREATED).body(notification);
    }

    @PostMapping("/send-to-role")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> sendToRole(@RequestBody Map<String, Object> request) {
        String role = (String) request.get("role");
        String title = (String) request.get("title");
        String message = (String) request.get("message");
        Map<String, String> data = (Map<String, String>) request.get("data");

        if (role == null || title == null || message == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing role, title, or message"));
        }

        // Send to all notifications matching role (we will broadcast or save in db and notify online clients)
        // For simulation, let's create a notification log matching recipient role
        Notification notification = new Notification();
        notification.setId("notif" + System.currentTimeMillis());
        notification.setRecipientRole(role.toLowerCase());
        // Since it's to a role, we can broadcast it to active clients in netty-socketio or mock it.
        // For database, we will save it for a broadcast recipient or create for specific seeded users.
        // Let's seed a copy for the main users matching that role
        String recipientId = role.equalsIgnoreCase("adopter") ? "u1" :
                              role.equalsIgnoreCase("shelter") ? "u2" :
                              role.equalsIgnoreCase("vet") ? "u3" : "admin";
        
        notification.setRecipientId(recipientId);
        notification.setType("system");
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setCreatedAt(Instant.now().toString());
        notification.setData(data);

        socketServerManager.sendNotification(notification);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
