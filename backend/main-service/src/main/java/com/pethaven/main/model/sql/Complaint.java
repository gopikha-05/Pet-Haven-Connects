package com.pethaven.main.model.sql;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "complaints")
public class Complaint {

    @Id
    private String id;
    private String title;
    private String raisedByUserId;
    private String raisedByRole;
    private String raisedByName;
    private String againstUserId;
    private String againstRole;
    private String againstName;
    private String category;
    private String status; // pending, under_review, action_taken, resolved, closed
    private String priority; // low, medium, high, emergency
    
    @Column(length = 2000)
    private String description;
    
    @Column(length = 1000)
    private String evidence;
    
    @Column(length = 2000)
    private String resolutionNotes;
    
    private String createdAt;
    private String updatedAt;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<ComplaintTimeline> timeline = new ArrayList<>();

    public Complaint() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getRaisedByUserId() { return raisedByUserId; }
    public void setRaisedByUserId(String raisedByUserId) { this.raisedByUserId = raisedByUserId; }

    public String getRaisedByRole() { return raisedByRole; }
    public void setRaisedByRole(String raisedByRole) { this.raisedByRole = raisedByRole; }

    public String getRaisedByName() { return raisedByName; }
    public void setRaisedByName(String raisedByName) { this.raisedByName = raisedByName; }

    public String getAgainstUserId() { return againstUserId; }
    public void setAgainstUserId(String againstUserId) { this.againstUserId = againstUserId; }

    public String getAgainstRole() { return againstRole; }
    public void setAgainstRole(String againstRole) { this.againstRole = againstRole; }

    public String getAgainstName() { return againstName; }
    public void setAgainstName(String againstName) { this.againstName = againstName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getEvidence() { return evidence; }
    public void setEvidence(String evidence) { this.evidence = evidence; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public List<ComplaintTimeline> getTimeline() { return timeline; }
    public void setTimeline(List<ComplaintTimeline> timeline) { this.timeline = timeline; }
}
