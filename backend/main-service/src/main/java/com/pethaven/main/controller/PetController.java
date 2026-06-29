package com.pethaven.main.controller;

import com.pethaven.main.model.nosql.Pet;
import com.pethaven.main.repository.nosql.PetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pets")
public class PetController {

    @Autowired
    private PetRepository petRepository;

    @GetMapping
    public ResponseEntity<List<Pet>> getAllPets(
            @RequestParam(required = false) String species,
            @RequestParam(required = false) String breed,
            @RequestParam(required = false) Integer ageMin,
            @RequestParam(required = false) Integer ageMax,
            @RequestParam(required = false) String healthStatus,
            @RequestParam(required = false) String temperament,
            @RequestParam(required = false) String shelter,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        List<Pet> pets = petRepository.findAll();

        // Apply filters in-memory
        return ResponseEntity.ok(pets.stream().filter(p -> {
            if (species != null && !species.isEmpty() && !p.getSpecies().equalsIgnoreCase(species)) return false;
            if (breed != null && !breed.isEmpty() && !p.getBreed().toLowerCase().contains(breed.toLowerCase())) return false;
            if (ageMin != null && p.getAge() < ageMin) return false;
            if (ageMax != null && p.getAge() > ageMax) return false;
            if (healthStatus != null && !healthStatus.isEmpty() && !p.getHealthStatus().equalsIgnoreCase(healthStatus)) return false;
            if (temperament != null && !temperament.isEmpty() && (p.getTemperament() == null || !p.getTemperament().contains(temperament.toLowerCase()))) return false;
            if (shelter != null && !shelter.isEmpty() && !p.getShelterId().equals(shelter)) return false;
            if (status != null && !status.isEmpty() && !p.getStatus().equalsIgnoreCase(status)) return false;
            
            if (search != null && !search.isEmpty()) {
                String q = search.toLowerCase();
                boolean matchesName = p.getName().toLowerCase().contains(q);
                boolean matchesBreed = p.getBreed().toLowerCase().contains(q);
                if (!matchesName && !matchesBreed) return false;
            }
            return true;
        }).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPetById(@PathVariable String id) {
        Optional<Pet> petOpt = petRepository.findById(id);
        if (petOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Pet not found"));
        }
        return ResponseEntity.ok(petOpt.get());
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_SHELTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<Pet> createPet(@RequestBody Pet pet) {
        if (pet.getId() == null || pet.getId().isEmpty()) {
            pet.setId("p" + System.currentTimeMillis());
        }
        if (pet.getStatus() == null) {
            pet.setStatus("available");
        }
        Pet saved = petRepository.save(pet);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_SHELTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> updatePet(@PathVariable String id, @RequestBody Pet updates) {
        Optional<Pet> petOpt = petRepository.findById(id);
        if (petOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Pet not found"));
        }
        Pet pet = petOpt.get();
        if (updates.getName() != null) pet.setName(updates.getName());
        if (updates.getSpecies() != null) pet.setSpecies(updates.getSpecies());
        if (updates.getBreed() != null) pet.setBreed(updates.getBreed());
        pet.setAge(updates.getAge());
        if (updates.getGender() != null) pet.setGender(updates.getGender());
        if (updates.getTemperament() != null) pet.setTemperament(updates.getTemperament());
        if (updates.getHealthStatus() != null) pet.setHealthStatus(updates.getHealthStatus());
        if (updates.getImages() != null) pet.setImages(updates.getImages());
        if (updates.getDescription() != null) pet.setDescription(updates.getDescription());
        pet.setVaccinated(updates.isVaccinated());
        pet.setNeutered(updates.isNeutered());
        pet.setAdoptionFee(updates.getAdoptionFee());
        if (updates.getVaccinations() != null) pet.setVaccinations(updates.getVaccinations());
        if (updates.getShelterNotes() != null) pet.setShelterNotes(updates.getShelterNotes());
        pet.setFeatured(updates.isFeatured());
        if (updates.getStatus() != null) pet.setStatus(updates.getStatus());

        Pet saved = petRepository.save(pet);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_SHELTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> deletePet(@PathVariable String id) {
        if (!petRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Pet not found"));
        }
        petRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ROLE_SHELTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> updatePetStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        String status = request.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing status value"));
        }
        Optional<Pet> petOpt = petRepository.findById(id);
        if (petOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Pet not found"));
        }
        Pet pet = petOpt.get();
        pet.setStatus(status);
        petRepository.save(pet);
        return ResponseEntity.ok(pet);
    }
}
