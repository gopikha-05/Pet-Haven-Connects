package com.pethaven.main.model.sql;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "donations")
public class Donation {

    @Id
    private String id;
    private double amount;
    private String date;
    private String method;
    private String shelter;
    private String status;
    private String invoiceId;
    private String userId;

    public Donation() {}

    public Donation(String id, double amount, String date, String method, String shelter, String status, String invoiceId, String userId) {
        this.id = id;
        this.amount = amount;
        this.date = date;
        this.method = method;
        this.shelter = shelter;
        this.status = status;
        this.invoiceId = invoiceId;
        this.userId = userId;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getShelter() { return shelter; }
    public void setShelter(String shelter) { this.shelter = shelter; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getInvoiceId() { return invoiceId; }
    public void setInvoiceId(String invoiceId) { this.invoiceId = invoiceId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
