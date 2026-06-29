package com.pethaven.auth.controller;

import com.pethaven.auth.model.LicenseRegistry;
import com.pethaven.auth.model.User;
import com.pethaven.auth.repository.LicenseRegistryRepository;
import com.pethaven.auth.repository.UserRepository;
import com.pethaven.auth.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.pethaven.auth.service.EmailService;
import com.pethaven.auth.model.SystemSetting;
import com.pethaven.auth.repository.SystemSettingRepository;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LicenseRegistryRepository licenseRegistryRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String email = request.get("email");
        String password = request.get("password");
        String roleInput = request.get("role");
        String licenseNumber = request.get("licenseNumber");
        String phone = request.get("phone");

        if (email == null || password == null || name == null || roleInput == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing required fields"));
        }

        String role = roleInput.toUpperCase();
        if (!role.equals("ADOPTER") && !role.equals("SHELTER") && !role.equals("VET") && !role.equals("ADMIN")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role"));
        }

        // Check if user exists
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User already exists"));
        }

        boolean needsApproval = role.equals("SHELTER") || role.equals("VET");

        // Validate license registry
        if (needsApproval) {
            if (licenseNumber == null || licenseNumber.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "License number is required for " + roleInput));
            }
            Optional<LicenseRegistry> registryOpt = licenseRegistryRepository.findByLicenseNumberAndRole(licenseNumber, role);
            if (registryOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "License ID " + licenseNumber + " not found in the official registry"));
            }
        }

        // Generate verification code (6 character alphanumeric)
        String verificationCode = UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        // Create user
        User user = new User();
        user.setId("u" + System.currentTimeMillis());
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setPhone(phone);
        user.setLicenseNumber(licenseNumber);
        user.setEmailVerified(false);
        user.setEmailVerificationToken(verificationCode);
        user.setApprovedByAdmin(!needsApproval); // Adopters/Admins auto-approved, Shelters/Vets need approval
        user.setLicenseVerificationStatus(needsApproval ? "pending" : "verified");
        user.setProfileCompleteness(role.equals("ADOPTER") ? 40 : 60);

        userRepository.save(user);

        // Send verification email via EmailService
        emailService.sendVerificationEmail(email, verificationCode);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Registration successful! Please verify your email.",
                "needsEmailVerification", true,
                "emailVerificationToken", verificationCode,
                "email", email
        ));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        if (token == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Verification token is required"));
        }

        Optional<User> userOpt = userRepository.findByEmailVerificationToken(token);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired verification token"));
        }

        User user = userOpt.get();
        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Email verified successfully!"));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        if (user.isEmailVerified()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already verified"));
        }

        String verificationCode = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        user.setEmailVerificationToken(verificationCode);
        userRepository.save(user);

        // Send verification email via EmailService
        emailService.sendVerificationEmail(email, verificationCode);

        return ResponseEntity.ok(Map.of(
                "message", "Verification code resent successfully!",
                "emailVerificationToken", verificationCode
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid credentials"));
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid credentials"));
        }

        // Check email verification
        if (!user.isEmailVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "message", "Please verify your email before logging in",
                    "requiresEmailVerification", true,
                    "email", user.getEmail()
            ));
        }

        // Check admin approval
        if (!user.isApprovedByAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "message", "Your account is pending admin approval",
                    "requiresApproval", true,
                    "licenseVerificationStatus", user.getLicenseVerificationStatus(),
                    "rejectionReason", user.getRejectionReason() != null ? user.getRejectionReason() : ""
            ));
        }

        String accessToken = jwtUtil.generateToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", accessToken);
        response.put("refreshToken", refreshToken);
        response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().toLowerCase()
        ));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Refresh token is required"));
        }

        if (jwtUtil.isTokenExpired(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Refresh token expired"));
        }

        String userId = jwtUtil.extractSubject(refreshToken);
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid token subject"));
        }

        User user = userOpt.get();
        String accessToken = jwtUtil.generateToken(user);
        String newRefreshToken = jwtUtil.generateRefreshToken(user);

        return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", newRefreshToken
        ));
    }

    @PostMapping("/verify-license")
    public ResponseEntity<?> verifyLicense(@RequestBody Map<String, String> request) {
        String licenseNumber = request.get("licenseNumber");
        String roleInput = request.get("role");

        if (licenseNumber == null || roleInput == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing license number or role"));
        }

        String role = roleInput.toUpperCase();
        if (!role.equals("SHELTER") && !role.equals("VET")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role must be SHELTER or VET"));
        }

        // Validate format patterns
        boolean matchesPattern = role.equals("SHELTER") ?
                licenseNumber.matches("^SHL-\\d{4}-\\d{5}$") :
                licenseNumber.matches("^VET-\\d{4}-\\d{5}$");

        if (!matchesPattern) {
            return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "message", "Invalid format. Expected: " + (role.equals("SHELTER") ? "SHL-YYYY-XXXXX" : "VET-YYYY-XXXXX")
            ));
        }

        Optional<LicenseRegistry> registryOpt = licenseRegistryRepository.findByLicenseNumberAndRole(licenseNumber, role);
        if (registryOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "message", "License not found in official registry"
            ));
        }

        LicenseRegistry registry = registryOpt.get();
        return ResponseEntity.ok(Map.of(
                "valid", true,
                "message", "License verified successfully",
                "licenseNumber", licenseNumber,
                "entityName", registry.getEntityName(),
                "city", registry.getCity()
        ));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        String resetToken = "reset_" + UUID.randomUUID().toString().substring(0, 8);
        user.setEmailVerificationToken(resetToken); // Temporarily store reset token here
        userRepository.save(user);

        // Send password reset email via EmailService
        emailService.sendPasswordResetEmail(email, resetToken);

        return ResponseEntity.ok(Map.of(
                "message", "Password reset code sent successfully!",
                "resetToken", resetToken
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        if (token == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing token or newPassword"));
        }

        Optional<User> userOpt = userRepository.findByEmailVerificationToken(token);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired reset token"));
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setEmailVerificationToken(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully!"));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        java.util.List<User> users = userRepository.findAll();
        java.util.List<Map<String, Object>> cleaned = users.stream()
                .map(this::cleanUser)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(cleaned);
    }

    @GetMapping("/shelters")
    public ResponseEntity<?> getShelters() {
        java.util.List<User> users = userRepository.findAllByRole("SHELTER");
        java.util.List<Map<String, Object>> cleaned = users.stream()
                .map(this::cleanUser)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(cleaned);
    }

    @GetMapping("/vets")
    public ResponseEntity<?> getVets() {
        java.util.List<User> users = userRepository.findAllByRole("VET");
        java.util.List<Map<String, Object>> cleaned = users.stream()
                .map(this::cleanUser)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(cleaned);
    }

    private Map<String, Object> cleanUser(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("email", user.getEmail());
        map.put("role", user.getRole() != null ? user.getRole().toLowerCase() : "");
        map.put("name", user.getName());
        map.put("phone", user.getPhone());
        map.put("licenseNumber", user.getLicenseNumber());
        map.put("emailVerified", user.isEmailVerified());
        map.put("isEmailVerified", user.isEmailVerified());
        map.put("approvedByAdmin", user.isApprovedByAdmin());
        map.put("isApproved", user.isApprovedByAdmin());
        map.put("licenseVerificationStatus", user.getLicenseVerificationStatus());
        map.put("rejectionReason", user.getRejectionReason());
        map.put("avatar", user.getAvatar());
        map.put("profileCompleteness", user.getProfileCompleteness());
        map.put("address", user.getAddress());
        map.put("petPreferencesSpecies", user.getPetPreferencesSpecies());
        map.put("petPreferencesMaxAge", user.getPetPreferencesMaxAge());
        map.put("emergencyContactName", user.getEmergencyContactName());
        map.put("emergencyContactPhone", user.getEmergencyContactPhone());
        map.put("emergencyContactRelationship", user.getEmergencyContactRelationship());
        map.put("createdAt", user.getCreatedAt());
        map.put("updatedAt", user.getUpdatedAt());

        // Backwards compatibility mappings for frontend
        map.put("status", user.isApprovedByAdmin() ? "active" : "pending");
        map.put("verified", "verified".equals(user.getLicenseVerificationStatus()));
        map.put("registered", true);

        // Fetch city dynamically from license registry or address
        String city = "";
        if (user.getLicenseNumber() != null && !user.getLicenseNumber().isEmpty() && user.getRole() != null) {
            Optional<com.pethaven.auth.model.LicenseRegistry> registryOpt = licenseRegistryRepository.findByLicenseNumberAndRole(user.getLicenseNumber(), user.getRole().toUpperCase());
            if (registryOpt.isPresent()) {
                city = registryOpt.get().getCity();
            }
        }
        if ((city == null || city.isEmpty()) && user.getAddress() != null) {
            String[] parts = user.getAddress().split(",");
            if (parts.length > 0) {
                city = parts[parts.length - 1].trim();
            }
        }
        map.put("city", city != null ? city : "");

        return map;
    }

    @PutMapping("/users/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable String id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }
        User user = userOpt.get();
        user.setApprovedByAdmin(true);
        user.setLicenseVerificationStatus("verified");
        user.setRejectionReason(null);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User approved successfully"));
    }

    @PutMapping("/users/{id}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable String id, @RequestBody Map<String, String> request) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }
        String reason = request.get("rejectionReason");
        User user = userOpt.get();
        user.setApprovedByAdmin(false);
        user.setLicenseVerificationStatus("rejected");
        user.setRejectionReason(reason != null ? reason : "License verification failed");
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User rejected successfully"));
    }

    @GetMapping("/smtp-settings")
    public ResponseEntity<?> getSmtpSettings() {
        Map<String, String> settings = new HashMap<>();
        settings.put("smtp_host", systemSettingRepository.findById("smtp_host").map(SystemSetting::getSettingValue).orElse(""));
        settings.put("smtp_port", systemSettingRepository.findById("smtp_port").map(SystemSetting::getSettingValue).orElse(""));
        settings.put("smtp_username", systemSettingRepository.findById("smtp_username").map(SystemSetting::getSettingValue).orElse(""));
        
        boolean hasPassword = systemSettingRepository.findById("smtp_password").map(s -> !s.getSettingValue().isEmpty()).orElse(false);
        settings.put("smtp_password", hasPassword ? "********" : "");
        
        return ResponseEntity.ok(settings);
    }

    @PostMapping("/smtp-settings")
    public ResponseEntity<?> saveSmtpSettings(@RequestBody Map<String, String> request) {
        String host = request.get("smtp_host");
        String portStr = request.get("smtp_port");
        String username = request.get("smtp_username");
        String password = request.get("smtp_password");

        if (host == null || portStr == null || username == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Host, Port, and Username are required"));
        }

        systemSettingRepository.save(new SystemSetting("smtp_host", host));
        systemSettingRepository.save(new SystemSetting("smtp_port", portStr));
        systemSettingRepository.save(new SystemSetting("smtp_username", username));

        if (password != null && !password.isEmpty() && !password.equals("********")) {
            systemSettingRepository.save(new SystemSetting("smtp_password", password));
        } else if (password != null && password.isEmpty()) {
            systemSettingRepository.save(new SystemSetting("smtp_password", ""));
        }

        try {
            int port = portStr.isEmpty() ? 587 : Integer.parseInt(portStr);
            String actualPassword = systemSettingRepository.findById("smtp_password").map(SystemSetting::getSettingValue).orElse("");
            emailService.updateSmtpSettings(host, port, username, actualPassword);
            return ResponseEntity.ok(Map.of("message", "SMTP settings saved and applied successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to apply SMTP settings: " + e.getMessage()));
        }
    }
}
