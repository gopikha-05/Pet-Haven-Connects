package com.pethaven.main.model.nosql;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "care_logs")
public class CareLogs {

    @Id
    private String id;
    private String petId;
    private String petName;
    private String date;
    private String logType; // diet, behavior, growth, general
    private String details;
    private String notes;

    public CareLogs() {}

    public CareLogs(String id, String petId, String petName, String date, String logType, String details, String notes) {
        this.id = id;
        this.petId = petId;
        this.petName = petName;
        this.date = date;
        this.logType = logType;
        this.details = details;
        this.notes = notes;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPetId() { return petId; }
    public void setPetId(String petId) { this.petId = petId; }

    public String getPetName() { return petName; }
    public void setPetName(String petName) { this.petName = petName; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getLogType() { return logType; }
    public void setLogType(String logType) { this.logType = logType; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
