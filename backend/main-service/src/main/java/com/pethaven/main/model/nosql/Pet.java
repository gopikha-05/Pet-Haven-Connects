package com.pethaven.main.model.nosql;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "pets")
public class Pet {

    @Id
    private String id;
    private String name;
    private String species;
    private String breed;
    private int age;
    private String gender;
    private List<String> temperament;
    private String healthStatus;
    private String shelterId;
    private String shelterName;
    private String location;
    private List<String> images;
    private String description;
    private boolean vaccinated;
    private boolean neutered;
    private double adoptionFee;
    private List<VaccinationRecord> vaccinations;
    private String shelterNotes;
    private boolean featured;
    private String status; // available, adopted, pending

    // Inner class for vaccinations
    public static class VaccinationRecord {
        private String name;
        private String date;
        private String nextDue;

        public VaccinationRecord() {}

        public VaccinationRecord(String name, String date, String nextDue) {
            this.name = name;
            this.date = date;
            this.nextDue = nextDue;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public String getNextDue() { return nextDue; }
        public void setNextDue(String nextDue) { this.nextDue = nextDue; }
    }

    public Pet() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecies() { return species; }
    public void setSpecies(String species) { this.species = species; }

    public String getBreed() { return breed; }
    public void setBreed(String breed) { this.breed = breed; }

    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public List<String> getTemperament() { return temperament; }
    public void setTemperament(List<String> temperament) { this.temperament = temperament; }

    public String getHealthStatus() { return healthStatus; }
    public void setHealthStatus(String healthStatus) { this.healthStatus = healthStatus; }

    public String getShelterId() { return shelterId; }
    public void setShelterId(String shelterId) { this.shelterId = shelterId; }

    public String getShelterName() { return shelterName; }
    public void setShelterName(String shelterName) { this.shelterName = shelterName; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isVaccinated() { return vaccinated; }
    public void setVaccinated(boolean vaccinated) { this.vaccinated = vaccinated; }

    public boolean isNeutered() { return neutered; }
    public void setNeutered(boolean neutered) { this.neutered = neutered; }

    public double getAdoptionFee() { return adoptionFee; }
    public void setAdoptionFee(double adoptionFee) { this.adoptionFee = adoptionFee; }

    public List<VaccinationRecord> getVaccinations() { return vaccinations; }
    public void setVaccinations(List<VaccinationRecord> vaccinations) { this.vaccinations = vaccinations; }

    public String getShelterNotes() { return shelterNotes; }
    public void setShelterNotes(String shelterNotes) { this.shelterNotes = shelterNotes; }

    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
