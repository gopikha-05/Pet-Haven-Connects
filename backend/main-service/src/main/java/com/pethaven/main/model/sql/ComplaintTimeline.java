package com.pethaven.main.model.sql;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "complaint_timeline")
public class ComplaintTimeline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "complaint_id", nullable = false)
    @JsonIgnore
    private Complaint complaint;

    private String status;
    private String date;
    private String note;
    private String actor;

    public ComplaintTimeline() {}

    public ComplaintTimeline(Complaint complaint, String status, String date, String note, String actor) {
        this.complaint = complaint;
        this.status = status;
        this.date = date;
        this.note = note;
        this.actor = actor;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Complaint getComplaint() { return complaint; }
    public void setComplaint(Complaint complaint) { this.complaint = complaint; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
}
