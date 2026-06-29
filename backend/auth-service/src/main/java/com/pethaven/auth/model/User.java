package com.pethaven.auth.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", uniqueConstraints = {@UniqueConstraint(columnNames = "email")})
public class User {

    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // ADOPTER, SHELTER, VET, ADMIN

    @Column(nullable = false)
    private String name;

    private String phone;
    private String licenseNumber;
    private boolean emailVerified;
    private String emailVerificationToken;
    private boolean approvedByAdmin;
    private String licenseVerificationStatus; // pending, verified, rejected
    private String rejectionReason;
    private String avatar;
    private int profileCompleteness;

    // Adopter preferences and contact info
    private String address;
    private String petPreferencesSpecies;
    private Integer petPreferencesMaxAge;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelationship;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Default Constructor
    public User() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public String getEmailVerificationToken() { return emailVerificationToken; }
    public void setEmailVerificationToken(String emailVerificationToken) { this.emailVerificationToken = emailVerificationToken; }

    public boolean isApprovedByAdmin() { return approvedByAdmin; }
    public void setApprovedByAdmin(boolean approvedByAdmin) { this.approvedByAdmin = approvedByAdmin; }

    public String getLicenseVerificationStatus() { return licenseVerificationStatus; }
    public void setLicenseVerificationStatus(String licenseVerificationStatus) { this.licenseVerificationStatus = licenseVerificationStatus; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public int getProfileCompleteness() { return profileCompleteness; }
    public void setProfileCompleteness(int profileCompleteness) { this.profileCompleteness = profileCompleteness; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPetPreferencesSpecies() { return petPreferencesSpecies; }
    public void setPetPreferencesSpecies(String petPreferencesSpecies) { this.petPreferencesSpecies = petPreferencesSpecies; }

    public Integer getPetPreferencesMaxAge() { return petPreferencesMaxAge; }
    public void setPetPreferencesMaxAge(Integer petPreferencesMaxAge) { this.petPreferencesMaxAge = petPreferencesMaxAge; }

    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }

    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }

    public String getEmergencyContactRelationship() { return emergencyContactRelationship; }
    public void setEmergencyContactRelationship(String emergencyContactRelationship) { this.emergencyContactRelationship = emergencyContactRelationship; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
