package com.pethaven.auth.model;

import jakarta.persistence.*;

@Entity
@Table(name = "license_registry")
public class LicenseRegistry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String licenseNumber;

    @Column(nullable = false)
    private String role; // SHELTER, VET

    @Column(nullable = false)
    private String entityName; // Shelter Name or Vet Name

    private String city;
    private String clinicName; // For veterinarians

    public LicenseRegistry() {}

    public LicenseRegistry(String licenseNumber, String role, String entityName, String city, String clinicName) {
        this.licenseNumber = licenseNumber;
        this.role = role;
        this.entityName = entityName;
        this.city = city;
        this.clinicName = clinicName;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getEntityName() { return entityName; }
    public void setEntityName(String entityName) { this.entityName = entityName; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getClinicName() { return clinicName; }
    public void setClinicName(String clinicName) { this.clinicName = clinicName; }
}
