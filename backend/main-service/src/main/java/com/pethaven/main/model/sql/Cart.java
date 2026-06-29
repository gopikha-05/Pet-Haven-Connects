package com.pethaven.main.model.sql;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "carts")
public class Cart {

    @Id
    private String adopterId;
    private double totalAmount;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<CartItem> products = new ArrayList<>();

    public Cart() {}

    public Cart(String adopterId, double totalAmount) {
        this.adopterId = adopterId;
        this.totalAmount = totalAmount;
    }

    // Getters and Setters
    public String getAdopterId() { return adopterId; }
    public void setAdopterId(String adopterId) { this.adopterId = adopterId; }

    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }

    public List<CartItem> getProducts() { return products; }
    public void setProducts(List<CartItem> products) { this.products = products; }
}
