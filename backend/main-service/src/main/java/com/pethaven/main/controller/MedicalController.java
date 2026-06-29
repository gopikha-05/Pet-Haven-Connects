package com.pethaven.main.controller;

import com.pethaven.main.model.nosql.CareLogs;
import com.pethaven.main.model.nosql.MedicalRecord;
import com.pethaven.main.model.nosql.Pet;
import com.pethaven.main.repository.nosql.CareLogsRepository;
import com.pethaven.main.repository.nosql.MedicalRecordRepository;
import com.pethaven.main.repository.nosql.PetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/medical")
public class MedicalController {

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private PetRepository petRepository;

    @Autowired
    private CareLogsRepository careLogsRepository;

    @GetMapping
    public ResponseEntity<List<MedicalRecord>> getAll() {
        return ResponseEntity.ok(medicalRecordRepository.findAll());
    }

    @GetMapping("/{petId}")
    public ResponseEntity<?> getByPetId(@PathVariable String petId) {
        Optional<MedicalRecord> recordOpt = medicalRecordRepository.findByPetId(petId);
        if (recordOpt.isEmpty()) {
            // Return an empty record format
            Optional<Pet> petOpt = petRepository.findById(petId);
            if (petOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Pet not found"));
            }
            Pet pet = petOpt.get();
            MedicalRecord record = new MedicalRecord();
            record.setPetId(petId);
            record.setPetName(pet.getName());
            record.setAllergies(new ArrayList<>());
            record.setTreatments(new ArrayList<>());
            record.setBehavioralNotes(new ArrayList<>());
            record.setDailyCareNotes(new ArrayList<>());
            return ResponseEntity.ok(record);
        }
        return ResponseEntity.ok(recordOpt.get());
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_VET') or hasRole('ROLE_SHELTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> createRecord(@RequestBody MedicalRecord record) {
        if (record.getPetId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing petId"));
        }
        Optional<MedicalRecord> existing = medicalRecordRepository.findByPetId(record.getPetId());
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Medical record for this pet already exists"));
        }
        if (record.getId() == null) {
            record.setId("m" + System.currentTimeMillis());
        }
        MedicalRecord saved = medicalRecordRepository.save(record);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{petId}/allergies")
    @PreAuthorize("hasRole('ROLE_VET') or hasRole('ROLE_SHELTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> updateAllergies(@PathVariable String petId, @RequestBody Map<String, List<String>> request) {
        List<String> allergies = request.get("allergies");
        MedicalRecord record = getOrCreateRecord(petId);
        record.setAllergies(allergies != null ? allergies : new ArrayList<>());
        return ResponseEntity.ok(medicalRecordRepository.save(record));
    }

    @PostMapping("/{petId}/treatments")
    @PreAuthorize("hasRole('ROLE_VET') or hasRole('ROLE_SHELTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> addTreatment(@PathVariable String petId, @RequestBody MedicalRecord.TreatmentEvent treatment) {
        if (treatment.getType() == null || treatment.getVet() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing treatment type or vet"));
        }
        MedicalRecord record = getOrCreateRecord(petId);
        if (record.getTreatments() == null) {
            record.setTreatments(new ArrayList<>());
        }
        if (treatment.getDate() == null) {
            treatment.setDate(Instant.now().toString().substring(0, 10));
        }
        record.getTreatments().add(treatment);

        // Also update pet's vaccinations if the treatment is a vaccination
        if (treatment.getType().toLowerCase().contains("vaccine") || treatment.getType().toLowerCase().contains("vaccination")) {
            Optional<Pet> petOpt = petRepository.findById(petId);
            if (petOpt.isPresent()) {
                Pet pet = petOpt.get();
                if (pet.getVaccinations() == null) {
                    pet.setVaccinations(new ArrayList<>());
                }
                pet.getVaccinations().add(new Pet.VaccinationRecord(treatment.getType(), treatment.getDate(), ""));
                pet.setVaccinated(true);
                petRepository.save(pet);
            }
        }

        return ResponseEntity.ok(medicalRecordRepository.save(record));
    }

    @PutMapping("/{petId}/behavioral")
    @PreAuthorize("hasRole('ROLE_VET') or hasRole('ROLE_SHELTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> updateBehavioralNotes(@PathVariable String petId, @RequestBody Map<String, List<String>> request) {
        List<String> notes = request.get("behavioralNotes");
        MedicalRecord record = getOrCreateRecord(petId);
        record.setBehavioralNotes(notes != null ? notes : new ArrayList<>());
        return ResponseEntity.ok(medicalRecordRepository.save(record));
    }

    @PutMapping("/{petId}/daily-care")
    @PreAuthorize("hasRole('ROLE_VET') or hasRole('ROLE_SHELTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> updateDailyCareNotes(@PathVariable String petId, @RequestBody Map<String, List<String>> request) {
        List<String> notes = request.get("dailyCareNotes");
        MedicalRecord record = getOrCreateRecord(petId);
        record.setDailyCareNotes(notes != null ? notes : new ArrayList<>());
        return ResponseEntity.ok(medicalRecordRepository.save(record));
    }

    // Care Logs endpoints
    @GetMapping("/care-logs/{petId}")
    public ResponseEntity<List<CareLogs>> getCareLogs(@PathVariable String petId) {
        return ResponseEntity.ok(careLogsRepository.findByPetId(petId));
    }

    @PostMapping("/care-logs")
    @PreAuthorize("hasRole('ROLE_ADOPTER') or hasRole('ROLE_SHELTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> addCareLog(@RequestBody CareLogs log) {
        if (log.getPetId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing petId"));
        }
        log.setId("log" + System.currentTimeMillis());
        if (log.getDate() == null) {
            log.setDate(Instant.now().toString());
        }
        CareLogs saved = careLogsRepository.save(log);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    private MedicalRecord getOrCreateRecord(String petId) {
        Optional<MedicalRecord> recordOpt = medicalRecordRepository.findByPetId(petId);
        if (recordOpt.isPresent()) {
            return recordOpt.get();
        }
        Optional<Pet> petOpt = petRepository.findById(petId);
        String petName = petOpt.isPresent() ? petOpt.get().getName() : "Unknown Pet";
        MedicalRecord record = new MedicalRecord();
        record.setId("m" + System.currentTimeMillis());
        record.setPetId(petId);
        record.setPetName(petName);
        record.setAllergies(new ArrayList<>());
        record.setTreatments(new ArrayList<>());
        record.setBehavioralNotes(new ArrayList<>());
        record.setDailyCareNotes(new ArrayList<>());
        return record;
    }
}
