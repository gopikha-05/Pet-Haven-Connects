package com.pethaven.auth.service;

import com.pethaven.auth.model.SystemSetting;
import com.pethaven.auth.repository.SystemSettingRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Value("${app.mail.from:${spring.mail.username:}}")
    private String senderEmail;

    @PostConstruct
    public void init() {
        try {
            String host = systemSettingRepository.findById("smtp_host").map(SystemSetting::getSettingValue).orElse("");
            String portStr = systemSettingRepository.findById("smtp_port").map(SystemSetting::getSettingValue).orElse("");
            String username = systemSettingRepository.findById("smtp_username").map(SystemSetting::getSettingValue).orElse("");
            String password = systemSettingRepository.findById("smtp_password").map(SystemSetting::getSettingValue).orElse("");

            if (!host.isEmpty() && !username.isEmpty() && !password.isEmpty()) {
                int port = portStr.isEmpty() ? 587 : Integer.parseInt(portStr);
                updateSmtpSettings(host, port, username, password);
                System.out.println("✅ Loaded SMTP settings from H2 database on startup!");
            }
        } catch (Exception e) {
            System.err.println("⚠️ Could not load SMTP settings from DB on startup: " + e.getMessage());
        }
    }

    public void updateSmtpSettings(String host, int port, String username, String password) {
        org.springframework.mail.javamail.JavaMailSenderImpl impl;
        if (mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl) {
            impl = (org.springframework.mail.javamail.JavaMailSenderImpl) mailSender;
        } else {
            impl = new org.springframework.mail.javamail.JavaMailSenderImpl();
            this.mailSender = impl;
        }
        impl.setHost(host);
        impl.setPort(port);
        impl.setUsername(username);
        impl.setPassword(password);
        
        // Set sender email to match username
        this.senderEmail = username;

        java.util.Properties props = impl.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");
        props.put("mail.smtp.writetimeout", "5000");
        System.out.println("✅ SMTP JavaMailSenderImpl updated dynamically!");
    }

    public void sendVerificationEmail(String recipientEmail, String code) {
        System.out.println("=================================================");
        System.out.println("📧 Sending verification email to: " + recipientEmail);
        System.out.println("Your 6-character email verification code is: " + code);
        System.out.println("=================================================");

        if (mailSender == null || senderEmail == null || senderEmail.isEmpty() || senderEmail.contains("your-email")) {
            System.out.println("⚠️ SMTP email settings not configured. Printed code above.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(recipientEmail);
            message.setSubject("Verify Your PetHaven Connect Account");
            message.setText("Welcome to PetHaven Connect!\n\n" +
                    "Your 6-character email verification code is: " + code + "\n\n" +
                    "Please enter this code in the app to verify your email.\n\n" +
                    "Best regards,\n" +
                    "PetHaven Connect Team");
            mailSender.send(message);
            System.out.println("✅ Verification email sent successfully via SMTP.");
        } catch (Exception e) {
            System.err.println("❌ Failed to send SMTP email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendPasswordResetEmail(String recipientEmail, String token) {
        System.out.println("=================================================");
        System.out.println("🔑 Sending password reset email to: " + recipientEmail);
        System.out.println("Use the following token to reset your password: " + token);
        System.out.println("=================================================");

        if (mailSender == null || senderEmail == null || senderEmail.isEmpty() || senderEmail.contains("your-email")) {
            System.out.println("⚠️ SMTP email settings not configured. Printed token above.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(recipientEmail);
            message.setSubject("Reset Your PetHaven Connect Password");
            message.setText("Hello,\n\n" +
                    "We received a request to reset your password. Use the following token to reset your password:\n" +
                    token + "\n\n" +
                    "If you did not request a password reset, please ignore this email.\n\n" +
                    "Best regards,\n" +
                    "PetHaven Connect Team");
            mailSender.send(message);
            System.out.println("✅ Password reset email sent successfully via SMTP.");
        } catch (Exception e) {
            System.err.println("❌ Failed to send SMTP password reset email: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
