package com.pethaven.main.service;

import com.pethaven.main.model.nosql.*;
import com.pethaven.main.model.sql.*;
import com.pethaven.main.repository.nosql.*;
import com.pethaven.main.repository.sql.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private PetRepository petRepository;
    @Autowired
    private AdoptionApplicationRepository applicationRepository;
    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private MedicalRecordRepository medicalRecordRepository;
    @Autowired
    private SupplyProductRepository productRepository;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private DonationRepository donationRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private ComplaintRepository complaintRepository;
    @Autowired
    private CartRepository cartRepository;

    @Override
    public void run(String... args) throws Exception {
        seedPets();
        seedApplications();
        seedAppointments();
        seedMedicalRecords();
        seedProducts();
        seedNotifications();
        seedDonations();
        seedTransactions();
        seedComplaints();
        seedCarts();
    }

    private void seedPets() {
        if (petRepository.count() == 0) {
            System.out.println("Seeding Pets in MongoDB...");
            
            // Pet 1
            Pet pet1 = new Pet();
            pet1.setId("p1");
            pet1.setName("Buddy");
            pet1.setSpecies("dog");
            pet1.setBreed("Golden Retriever");
            pet1.setAge(2);
            pet1.setGender("male");
            pet1.setTemperament(List.of("friendly", "energetic", "loyal"));
            pet1.setHealthStatus("excellent");
            pet1.setShelterId("sh1");
            pet1.setShelterName("Happy Paws Shelter");
            pet1.setLocation("Mumbai");
            pet1.setImages(List.of("https://images.unsplash.com/photo-1558788353-f76f925a9e24?w=800&q=80"));
            pet1.setDescription("Buddy is a loving golden retriever who loves walks and belly rubs.");
            pet1.setVaccinated(true);
            pet1.setNeutered(true);
            pet1.setAdoptionFee(5000);
            pet1.setVaccinations(List.of(
                    new Pet.VaccinationRecord("Rabies", "2025-11-01", "2026-11-01"),
                    new Pet.VaccinationRecord("DHPP", "2025-10-15", "2026-10-15")
            ));
            pet1.setShelterNotes("Great with kids. House-trained.");
            pet1.setFeatured(true);
            pet1.setStatus("available");
            petRepository.save(pet1);

            // Pet 2
            Pet pet2 = new Pet();
            pet2.setId("p2");
            pet2.setName("Luna");
            pet2.setSpecies("cat");
            pet2.setBreed("British Shorthair");
            pet2.setAge(1);
            pet2.setGender("female");
            pet2.setTemperament(List.of("calm", "affectionate"));
            pet2.setHealthStatus("good");
            pet2.setShelterId("sh2");
            pet2.setShelterName("Safe Haven Rescue");
            pet2.setLocation("Delhi");
            pet2.setImages(List.of("https://images.unsplash.com/photo-1592194999418-475e03fbaa1?w=800&q=80"));
            pet2.setDescription("Luna is a gentle British Shorthair who enjoys sunny windowsills and quiet evenings.");
            pet2.setVaccinated(true);
            pet2.setNeutered(true);
            pet2.setAdoptionFee(3500);
            pet2.setVaccinations(List.of(new Pet.VaccinationRecord("FVRCP", "2025-12-01", "2026-12-01")));
            pet2.setShelterNotes("Indoor only preferred.");
            pet2.setFeatured(true);
            pet2.setStatus("available");
            petRepository.save(pet2);

            // Pet 3
            Pet pet3 = new Pet();
            pet3.setId("p3");
            pet3.setName("Charlie");
            pet3.setSpecies("dog");
            pet3.setBreed("Labrador Mix");
            pet3.setAge(4);
            pet3.setGender("male");
            pet3.setTemperament(List.of("gentle", "trained"));
            pet3.setHealthStatus("good");
            pet3.setShelterId("sh1");
            pet3.setShelterName("Happy Paws Shelter");
            pet3.setLocation("Pune");
            pet3.setImages(List.of("https://images.unsplash.com/photo-1561037404-61cd46aa615c?w=800&q=80"));
            pet3.setDescription("Charlie is a senior-friendly lab mix looking for a calm home and short daily walks.");
            pet3.setVaccinated(true);
            pet3.setNeutered(true);
            pet3.setAdoptionFee(4000);
            pet3.setVaccinations(new ArrayList<>());
            pet3.setShelterNotes("Needs daily medication for arthritis.");
            pet3.setFeatured(false);
            pet3.setStatus("available");
            petRepository.save(pet3);

            // Pet 4
            Pet pet4 = new Pet();
            pet4.setId("p4");
            pet4.setName("Whiskers");
            pet4.setSpecies("cat");
            pet4.setBreed("Domestic Shorthair (Tabby)");
            pet4.setAge(3);
            pet4.setGender("male");
            pet4.setTemperament(List.of("playful", "curious"));
            pet4.setHealthStatus("fair");
            pet4.setShelterId("sh2");
            pet4.setShelterName("Safe Haven Rescue");
            pet4.setLocation("Bangalore");
            pet4.setImages(List.of("https://images.unsplash.com/photo-1495366691023-cc1a575a0938?w=800&q=80"));
            pet4.setDescription("Whiskers is a curious tabby who loves window perches and gets along well with calm dogs.");
            pet4.setVaccinated(true);
            pet4.setNeutered(false);
            pet4.setAdoptionFee(2500);
            pet4.setVaccinations(List.of(new Pet.VaccinationRecord("Rabies", "2025-08-01", "2026-08-01")));
            pet4.setShelterNotes("Scheduled for neutering next week.");
            pet4.setFeatured(false);
            pet4.setStatus("available");
            petRepository.save(pet4);

            System.out.println("Seeded " + petRepository.count() + " pets.");
        }
    }

    private void seedApplications() {
        if (applicationRepository.count() == 0) {
            System.out.println("Seeding Adoption Applications in MongoDB...");

            AdoptionApplication app1 = new AdoptionApplication();
            app1.setId("app1");
            app1.setPetId("p1");
            app1.setPetName("Buddy");
            app1.setAdopterId("u1");
            app1.setAdopterName("Sarah Mitchell");
            app1.setStatus("under_review");
            app1.setSubmittedAt("2026-05-10T14:30:00Z");
            app1.setUpdatedAt("2026-05-15T09:00:00Z");
            app1.setFullName("Sarah Mitchell");
            app1.setAge("32");
            app1.setPhone("555-123-4567");
            app1.setEmail("adopter@pethaven.com");
            app1.setAddress("123 Main St, Apt 4B, Mumbai");
            app1.setOccupation("Software Engineer");
            app1.setPreviousPetExperience("experienced");
            app1.setExperienceExplanation("I have owned dogs for over 5 years and have experience with training and care.");
            app1.setReason("Looking for a companion for daily walks and companionship.");
            app1.setHomeType("apartment");
            app1.setHasYard(false);
            app1.setExistingPets("None currently");
            app1.setFamilyMemberCount("2");
            app1.setDailyAvailability("3-4");
            app1.setFinancialReadiness("high");
            app1.setVetReference("Dr. Smith at City Vet Clinic - 555-987-6543");
            app1.setHomeImage("home-image-1.jpg");
            app1.setTimeline(List.of(
                    new AdoptionApplication.TimelineEvent("pending", "2026-05-10T14:30:00Z", "Application submitted"),
                    new AdoptionApplication.TimelineEvent("under_review", "2026-05-12T10:00:00Z", "Shelter reviewing documents")
            ));
            applicationRepository.save(app1);

            AdoptionApplication app2 = new AdoptionApplication();
            app2.setId("app2");
            app2.setPetId("p2");
            app2.setPetName("Luna");
            app2.setAdopterId("u1");
            app2.setAdopterName("Sarah Mitchell");
            app2.setStatus("approved");
            app2.setSubmittedAt("2026-04-20T11:00:00Z");
            app2.setUpdatedAt("2026-04-25T16:00:00Z");
            app2.setFullName("Sarah Mitchell");
            app2.setAge("32");
            app2.setPhone("555-123-4567");
            app2.setEmail("adopter@pethaven.com");
            app2.setAddress("123 Main St, Apt 4B, Mumbai");
            app2.setOccupation("Software Engineer");
            app2.setPreviousPetExperience("some");
            app2.setExperienceExplanation("I had cats growing up and have some experience with cat care.");
            app2.setReason("Want a calm indoor cat for my apartment.");
            app2.setHomeType("apartment");
            app2.setHasYard(false);
            app2.setExistingPets("None currently");
            app2.setFamilyMemberCount("1");
            app2.setDailyAvailability("5+");
            app2.setFinancialReadiness("high");
            app2.setVetReference("Dr. Smith at City Vet Clinic - 555-987-6543");
            app2.setHomeImage("home-image-2.jpg");
            app2.setTimeline(List.of(
                    new AdoptionApplication.TimelineEvent("pending", "2026-04-20T11:00:00Z", "Application submitted"),
                    new AdoptionApplication.TimelineEvent("under_review", "2026-04-22T09:00:00Z", "Home visit scheduled"),
                    new AdoptionApplication.TimelineEvent("approved", "2026-04-25T16:00:00Z", "Adoption approved!")
            ));
            applicationRepository.save(app2);

            System.out.println("Seeded " + applicationRepository.count() + " applications.");
        }
    }

    private void seedAppointments() {
        if (appointmentRepository.count() == 0) {
            System.out.println("Seeding Vet Appointments in MongoDB...");

            Appointment apt1 = new Appointment();
            apt1.setId("apt1");
            apt1.setPetId("p2");
            apt1.setPetName("Luna");
            apt1.setVetId("u3");
            apt1.setVetName("Dr. Rajesh Kumar");
            apt1.setDate("2026-06-15");
            apt1.setTime("10:00");
            apt1.setType("checkup");
            apt1.setStatus("confirmed");
            apt1.setNotes("Annual wellness check");
            appointmentRepository.save(apt1);

            Appointment apt2 = new Appointment();
            apt2.setId("apt2");
            apt2.setPetId("p1");
            apt2.setPetName("Buddy");
            apt2.setVetId("u3");
            apt2.setVetName("Dr. Rajesh Kumar");
            apt2.setDate("2026-06-18");
            apt2.setTime("14:30");
            apt2.setType("vaccination");
            apt2.setStatus("pending");
            apt2.setNotes("Rabies booster");
            appointmentRepository.save(apt2);

            System.out.println("Seeded " + appointmentRepository.count() + " appointments.");
        }
    }

    private void seedMedicalRecords() {
        if (medicalRecordRepository.count() == 0) {
            System.out.println("Seeding Medical Records in MongoDB...");

            MedicalRecord r1 = new MedicalRecord();
            r1.setId("m1");
            r1.setPetId("p2");
            r1.setPetName("Luna");
            r1.setAllergies(List.of("fish"));
            r1.setBehavioralNotes(List.of("Prefers quiet environments", "Anxious during thunderstorms"));
            r1.setDailyCareNotes(List.of("Feed twice daily", "Fresh water always", "Brush weekly"));
            r1.setTreatments(List.of(
                    new MedicalRecord.TreatmentEvent("2026-03-01", "Dental cleaning", "Dr. Rajesh Kumar", "No complications"),
                    new MedicalRecord.TreatmentEvent("2026-01-15", "FVRCP Vaccine", "Dr. Rajesh Kumar", "Routine vaccination")
            ));
            medicalRecordRepository.save(r1);

            System.out.println("Seeded " + medicalRecordRepository.count() + " medical records.");
        }
    }

    private void seedProducts() {
        if (productRepository.count() == 0) {
            System.out.println("Seeding Supply Products in MongoDB...");

            productRepository.save(new SupplyProduct("sp1", "Premium Dog Food 5kg", "https://images.unsplash.com/photo-1589924691995-400dc9ecc307?w=200", 1200, "High-quality dry dog food with essential nutrients for adult dogs.", 50, "sh1", "Happy Paws Shelter"));
            productRepository.save(new SupplyProduct("sp2", "Cat Litter 10L", "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200", 450, "Clumping cat litter with odor control technology.", 30, "sh1", "Happy Paws Shelter"));
            productRepository.save(new SupplyProduct("sp3", "Grooming Kit", "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200", 899, "Complete grooming kit including brush, comb, and nail clippers.", 25, "sh2", "Safe Haven Rescue"));
            productRepository.save(new SupplyProduct("sp4", "Dog Leash Premium", "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200", 650, "Durable and comfortable leash for daily walks.", 40, "sh2", "Safe Haven Rescue"));

            System.out.println("Seeded " + productRepository.count() + " products.");
        }
    }

    private void seedNotifications() {
        if (notificationRepository.count() == 0) {
            System.out.println("Seeding Notifications in MongoDB...");

            Notification n1 = new Notification();
            n1.setId("n1");
            n1.setRecipientId("u1");
            n1.setRecipientRole("adopter");
            n1.setType("adoption");
            n1.setTitle("Application Approved");
            n1.setMessage("Congratulations! Your application for Luna has been approved.");
            n1.setRead(false);
            n1.setCreatedAt("2026-05-18T10:00:00Z");
            n1.setData(Map.of("applicationId", "app2", "petName", "Luna"));
            notificationRepository.save(n1);

            System.out.println("Seeded " + notificationRepository.count() + " notifications.");
        }
    }

    private void seedDonations() {
        if (donationRepository.count() == 0) {
            System.out.println("Seeding Donations in SQL...");

            donationRepository.save(new Donation("d1", 2000, "2026-05-10", "upi", "Happy Paws Shelter", "completed", "INV-2026-001", "u1"));
            donationRepository.save(new Donation("d2", 500, "2026-04-15", "card", "Safe Haven Rescue", "completed", "INV-2026-002", "u1"));
            donationRepository.save(new Donation("d3", 1500, "2026-03-20", "wallet", "Platform General Fund", "completed", "INV-2026-003", "u1"));

            System.out.println("Seeded " + donationRepository.count() + " donations.");
        }
    }

    private void seedTransactions() {
        if (transactionRepository.count() == 0) {
            System.out.println("Seeding Transactions in SQL...");

            transactionRepository.save(new Transaction("t1", "vaccination", "Rabies vaccine - Luna", 800, "2026-04-01", "paid", "u1"));
            transactionRepository.save(new Transaction("t2", "grooming", "Full grooming - Luna", 1200, "2026-04-10", "paid", "u1"));
            transactionRepository.save(new Transaction("t3", "donation", "Shelter donation", 2000, "2026-05-10", "paid", "u1"));

            System.out.println("Seeded " + transactionRepository.count() + " transactions.");
        }
    }

    private void seedComplaints() {
        if (complaintRepository.count() == 0) {
            System.out.println("Seeding Complaints in SQL...");

            Complaint c1 = new Complaint();
            c1.setId("c1");
            c1.setTitle("Overcrowded facility");
            c1.setRaisedByUserId("u1");
            c1.setRaisedByRole("adopter");
            c1.setRaisedByName("Sarah Mitchell");
            c1.setAgainstUserId("u2");
            c1.setAgainstRole("shelter");
            c1.setAgainstName("Happy Paws Shelter");
            c1.setCategory("Facility Conditions");
            c1.setStatus("pending");
            c1.setPriority("high");
            c1.setDescription("The shelter appears to be overcrowded with poor living conditions for the animals.");
            c1.setEvidence("Photos attached showing cramped cages");
            c1.setCreatedAt("2026-05-17T10:00:00Z");
            c1.setUpdatedAt("2026-05-17T10:00:00Z");
            
            // Set timeline
            c1.getTimeline().add(new ComplaintTimeline(c1, "pending", "2026-05-17T10:00:00Z", "Complaint submitted", "Sarah Mitchell"));
            complaintRepository.save(c1);

            Complaint c2 = new Complaint();
            c2.setId("c2");
            c2.setTitle("Application processing delay");
            c2.setRaisedByUserId("u1");
            c2.setRaisedByRole("adopter");
            c2.setRaisedByName("Sarah Mitchell");
            c2.setAgainstUserId("u2");
            c2.setAgainstRole("shelter");
            c2.setAgainstName("Happy Paws Shelter");
            c2.setCategory("Process Delay");
            c2.setStatus("under_review");
            c2.setPriority("medium");
            c2.setDescription("My adoption application has been pending for over 2 weeks without any update.");
            c2.setEvidence("Application submission receipt");
            c2.setResolutionNotes("Shelter is reviewing the application and will respond within 48 hours");
            c2.setCreatedAt("2026-05-16T14:30:00Z");
            c2.setUpdatedAt("2026-05-18T09:00:00Z");

            c2.getTimeline().add(new ComplaintTimeline(c2, "pending", "2026-05-16T14:30:00Z", "Complaint submitted", "Sarah Mitchell"));
            c2.getTimeline().add(new ComplaintTimeline(c2, "under_review", "2026-05-18T09:00:00Z", "Shelter acknowledged and investigating", "Happy Paws Shelter"));
            complaintRepository.save(c2);

            System.out.println("Seeded " + complaintRepository.count() + " complaints.");
        }
    }

    private void seedCarts() {
        if (cartRepository.count() == 0) {
            System.out.println("Seeding Adopter Cart in SQL...");
            
            Cart cart = new Cart("u1", 0.0);
            cartRepository.save(cart);
            
            System.out.println("Seeded empty cart for adopter u1.");
        }
    }
}
