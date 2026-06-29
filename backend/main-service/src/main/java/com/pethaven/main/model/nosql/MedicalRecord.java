package com.pethaven.main.model.nosql;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "medical_records")
public class MedicalRecord {

    @Id
    private String id;
    private String petId;
    private String petName;
    private List<String> allergies;
    private List<TreatmentEvent> treatments;
    private List<String> behavioralNotes;
    private List<String> dailyCareNotes;

    public static class TreatmentEvent {
        private String date;
        private String type;
        private String vet;
        private String notes;

        public TreatmentEvent() {}

        public TreatmentEvent(String date, String type, String vet, String notes) {
            this.date = date;
            this.type = type;
            this.vet = vet;
            this.notes = notes;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public String getVet() { return vet; }
        public void setVet(String vet) { this.vet = vet; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public MedicalRecord() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPetId() { return petId; }
    public void setPetId(String petId) { this.petId = petId; }

    public String getPetName() { return petName; }
    public void setPetName(String petName) { this.petName = petName; }

    public List<String> getAllergies() { return allergies; }
    public void setAllergies(List<String> allergies) { this.allergies = allergies; }

    public List<TreatmentEvent> getTreatments() { return treatments; }
    public void setTreatments(List<TreatmentEvent> treatments) { this.treatments = treatments; }

    public List<String> getBehavioralNotes() { return behavioralNotes; }
    public void setBehavioralNotes(List<String> behavioralNotes) { this.behavioralNotes = behavioralNotes; }

    public List<String> getDailyCareNotes() { return dailyCareNotes; }
    public void setDailyCareNotes(List<String> dailyCareNotes) { this.dailyCareNotes = dailyCareNotes; }
}
