package com.pethaven.main.model.nosql;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "supply_products")
public class SupplyProduct {

    @Id
    private String id;
    private String productName;
    private String image;
    private double price;
    private String description;
    private int stock;
    private String shelterId;
    private String shelterName;

    public SupplyProduct() {}

    public SupplyProduct(String id, String productName, String image, double price, String description, int stock, String shelterId, String shelterName) {
        this.id = id;
        this.productName = productName;
        this.image = image;
        this.price = price;
        this.description = description;
        this.stock = stock;
        this.shelterId = shelterId;
        this.shelterName = shelterName;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }

    public String getShelterId() { return shelterId; }
    public void setShelterId(String shelterId) { this.shelterId = shelterId; }

    public String getShelterName() { return shelterName; }
    public void setShelterName(String shelterName) { this.shelterName = shelterName; }
}
