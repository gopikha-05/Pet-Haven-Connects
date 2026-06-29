package com.pethaven.main.model.nosql;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "adoption_applications")
public class AdoptionApplication {

    @Id
    private String id;
    private String petId;
    private String petName;
    private String adopterId;
    private String adopterName;
    private String status; // pending, under_review, approved, rejected
    private String submittedAt;
    private String updatedAt;

    // Personal Details
    private String fullName;
    private String age;
    private String phone;
    private String email;
    private String address;
    private String occupation;

    // Suitability Details
    private String previousPetExperience; // none, some, experienced
    private String experienceExplanation;
    private String reason;
    private String homeType; // house, apartment, condo
    private boolean hasYard;
    private String existingPets;
    private String familyMemberCount;
    private String dailyAvailability;
    private String financialReadiness;
    private String vetReference;

    private String homeImage;
    private List<TimelineEvent> timeline;

    public static class TimelineEvent {
        private String status;
        private String date;
        private String note;

        public TimelineEvent() {}

        public TimelineEvent(String status, String date, String note) {
            this.status = status;
            this.date = date;
            this.note = note;
        }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    public AdoptionApplication() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPetId() { return petId; }
    public void setPetId(String petId) { this.petId = petId; }

    public String getPetName() { return petName; }
    public void setPetName(String petName) { this.petName = petName; }

    public String getAdopterId() { return adopterId; }
    public void setAdopterId(String adopterId) { this.adopterId = adopterId; }

    public String getAdopterName() { return adopterName; }
    public void setAdopterName(String adopterName) { this.adopterName = adopterName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getAge() { return age; }
    public void setAge(String age) { this.age = age; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }

    public String getPreviousPetExperience() { return previousPetExperience; }
    public void setPreviousPetExperience(String previousPetExperience) { this.previousPetExperience = previousPetExperience; }

    public String getExperienceExplanation() { return experienceExplanation; }
    public void setExperienceExplanation(String experienceExplanation) { this.experienceExplanation = experienceExplanation; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getHomeType() { return homeType; }
    public void setHomeType(String homeType) { this.homeType = homeType; }

    public boolean isHasYard() { return hasYard; }
    public void setHasYard(boolean hasYard) { this.hasYard = hasYard; }

    public String getExistingPets() { return existingPets; }
    public void setExistingPets(String existingPets) { this.existingPets = existingPets; }

    public String getFamilyMemberCount() { return familyMemberCount; }
    public void setFamilyMemberCount(String familyMemberCount) { this.familyMemberCount = familyMemberCount; }

    public String getDailyAvailability() { return dailyAvailability; }
    public void setDailyAvailability(String dailyAvailability) { this.dailyAvailability = dailyAvailability; }

    public String getFinancialReadiness() { return financialReadiness; }
    public void setFinancialReadiness(String financialReadiness) { this.financialReadiness = financialReadiness; }

    public String getVetReference() { return vetReference; }
    public void setVetReference(String vetReference) { this.vetReference = vetReference; }

    public String getHomeImage() { return homeImage; }
    public void setHomeImage(String homeImage) { this.homeImage = homeImage; }

    public List<TimelineEvent> getTimeline() { return timeline; }
    public void setTimeline(List<TimelineEvent> timeline) { this.timeline = timeline; }
}
