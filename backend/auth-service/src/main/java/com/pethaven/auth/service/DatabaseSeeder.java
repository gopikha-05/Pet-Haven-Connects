package com.pethaven.auth.service;

import com.pethaven.auth.model.LicenseRegistry;
import com.pethaven.auth.model.User;
import com.pethaven.auth.repository.LicenseRegistryRepository;
import com.pethaven.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LicenseRegistryRepository licenseRegistryRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedLicenseRegistry();
        seedUsers();
    }

    private void seedLicenseRegistry() {
        if (licenseRegistryRepository.count() == 0) {
            System.out.println("Seeding License Registry...");
            // Shelters
            licenseRegistryRepository.save(new LicenseRegistry("SHL-2024-10452", "SHELTER", "Happy Paws Shelter", "Mumbai", null));
            licenseRegistryRepository.save(new LicenseRegistry("SHL-2024-10453", "SHELTER", "Safe Haven Rescue", "Delhi", null));
            licenseRegistryRepository.save(new LicenseRegistry("SHL-2024-10454", "SHELTER", "Paws & Claws", "Pune", null));
            licenseRegistryRepository.save(new LicenseRegistry("SHL-2024-10455", "SHELTER", "City Animal Shelter", "Bangalore", null));
            licenseRegistryRepository.save(new LicenseRegistry("SHL-2024-10456", "SHELTER", "Blue Cross Shelter", "Chennai", null));
            licenseRegistryRepository.save(new LicenseRegistry("SHL-2024-10457", "SHELTER", "Pet Paradise", "Hyderabad", null));
            
            // Veterinarians
            licenseRegistryRepository.save(new LicenseRegistry("VET-2024-88231", "VET", "Dr. Rajesh Kumar", "Mumbai", "PetCare Clinic"));
            licenseRegistryRepository.save(new LicenseRegistry("VET-2024-88232", "VET", "Dr. Priya Sharma", "Delhi", "Animal Health Center"));
            licenseRegistryRepository.save(new LicenseRegistry("VET-2024-88233", "VET", "Dr. Amit Patel", "Pune", "VetCare Plus"));
            licenseRegistryRepository.save(new LicenseRegistry("VET-2024-88234", "VET", "Dr. Sneha Patil", "Bangalore", "City Vet Hospital"));
            licenseRegistryRepository.save(new LicenseRegistry("VET-2024-88235", "VET", "Dr. Suresh Reddy", "Chennai", "Chennai Pet Clinic"));
            
            System.out.println("Seeded " + licenseRegistryRepository.count() + " license records.");
        }
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            System.out.println("Seeding Default Users...");

            // 1. Adopter
            User adopter = new User();
            adopter.setId("u1");
            adopter.setEmail("adopter@pethaven.com");
            adopter.setPassword(passwordEncoder.encode("Adopter@123"));
            adopter.setRole("ADOPTER");
            adopter.setName("Sarah Mitchell");
            adopter.setPhone("9876543210");
            adopter.setEmailVerified(true);
            adopter.setApprovedByAdmin(true);
            adopter.setProfileCompleteness(85);
            adopter.setAvatar("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150");
            adopter.setAddress("123 Main St, Apt 4B, Mumbai");
            adopter.setPetPreferencesSpecies("dog,cat");
            adopter.setPetPreferencesMaxAge(5);
            adopter.setEmergencyContactName("John Mitchell");
            adopter.setEmergencyContactPhone("9876543211");
            adopter.setEmergencyContactRelationship("Brother");
            userRepository.save(adopter);

            // 2. Shelter
            User shelter = new User();
            shelter.setId("u2");
            shelter.setEmail("shelter@pethaven.com");
            shelter.setPassword(passwordEncoder.encode("Shelter@123"));
            shelter.setRole("SHELTER");
            shelter.setName("Happy Paws Shelter");
            shelter.setPhone("9123456780");
            shelter.setLicenseNumber("SHL-2024-10452");
            shelter.setEmailVerified(true);
            shelter.setApprovedByAdmin(true);
            shelter.setLicenseVerificationStatus("verified");
            shelter.setProfileCompleteness(100);
            shelter.setAvatar("https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=150");
            userRepository.save(shelter);

            // 2b. Safe Haven Rescue
            User shelter2 = new User();
            shelter2.setId("u5");
            shelter2.setEmail("safehaven@pethaven.com");
            shelter2.setPassword(passwordEncoder.encode("Shelter@123"));
            shelter2.setRole("SHELTER");
            shelter2.setName("Safe Haven Rescue");
            shelter2.setPhone("9123456781");
            shelter2.setLicenseNumber("SHL-2024-10453");
            shelter2.setEmailVerified(true);
            shelter2.setApprovedByAdmin(true);
            shelter2.setLicenseVerificationStatus("verified");
            shelter2.setProfileCompleteness(100);
            shelter2.setAvatar("https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=150");
            userRepository.save(shelter2);

            // 3. Vet
            User vet = new User();
            vet.setId("u3");
            vet.setEmail("vet@pethaven.com");
            vet.setPassword(passwordEncoder.encode("Vet@123456"));
            vet.setRole("VET");
            vet.setName("Dr. Rajesh Kumar");
            vet.setPhone("9988776655");
            vet.setLicenseNumber("VET-2024-88231");
            vet.setEmailVerified(true);
            vet.setApprovedByAdmin(true);
            vet.setLicenseVerificationStatus("verified");
            vet.setProfileCompleteness(95);
            vet.setAvatar("https://images.unsplash.com/photo-1612349317150-e413f4a5b16d?w=150");
            userRepository.save(vet);

            // 4. Admin
            User admin = new User();
            admin.setId("u4");
            admin.setEmail("admin@pethaven.com");
            admin.setPassword(passwordEncoder.encode("Admin@123456"));
            admin.setRole("ADMIN");
            admin.setName("Platform Admin");
            admin.setPhone("9000000001");
            admin.setEmailVerified(true);
            admin.setApprovedByAdmin(true);
            admin.setProfileCompleteness(100);
            admin.setAvatar("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150");
            userRepository.save(admin);

            System.out.println("Seeded " + userRepository.count() + " users.");
        }
    }
}
