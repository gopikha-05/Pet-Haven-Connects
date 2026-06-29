package com.pethaven.main.socket;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.pethaven.main.model.nosql.Notification;
import com.pethaven.main.repository.nosql.NotificationRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SocketServerManager {

    private SocketIOServer server;
    private final Map<String, UUID> userSessions = new ConcurrentHashMap<>();

    @Autowired
    private NotificationRepository notificationRepository;

    @Value("${socketio.host:0.0.0.0}")
    private String host;

    @Value("${socketio.port:5002}")
    private int port;

    @PostConstruct
    public void startServer() {
        Configuration config = new Configuration();
        config.setHostname(host);
        config.setPort(port);
        config.setOrigin("http://localhost:5173,http://localhost:5174");

        server = new SocketIOServer(config);

        server.addConnectListener(client -> {
            System.out.println("Socket.io client connected: " + client.getSessionId());
        });

        server.addDisconnectListener(client -> {
            System.out.println("Socket.io client disconnected: " + client.getSessionId());
            userSessions.entrySet().removeIf(entry -> entry.getValue().equals(client.getSessionId()));
        });

        server.addEventListener("register_user", String.class, (client, userId, ackSender) -> {
            System.out.println("Socket.io registering user: " + userId + " for client: " + client.getSessionId());
            userSessions.put(userId, client.getSessionId());
            
            // Push unread notification count
            long unreadCount = notificationRepository.findByRecipientIdAndIsRead(userId, false).size();
            client.sendEvent("notification_count", Map.of("count", unreadCount));
        });

        server.start();
        System.out.println("Netty Socket.io server started on " + host + ":" + port);
    }

    @PreDestroy
    public void stopServer() {
        if (server != null) {
            server.stop();
            System.out.println("Netty Socket.io server stopped.");
        }
    }

    public void sendNotification(Notification notification) {
        // Persist notification in MongoDB
        notificationRepository.save(notification);

        // If user is connected online, send it in real time
        UUID clientUuid = userSessions.get(notification.getRecipientId());
        if (clientUuid != null) {
            SocketIOClient client = server.getClient(clientUuid);
            if (client != null) {
                client.sendEvent("new_notification", notification);
                
                long unreadCount = notificationRepository.findByRecipientIdAndIsRead(notification.getRecipientId(), false).size();
                client.sendEvent("notification_count", Map.of("count", unreadCount));
            }
        }
    }
}
