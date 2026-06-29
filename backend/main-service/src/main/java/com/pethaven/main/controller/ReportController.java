package com.pethaven.main.controller;

import com.pethaven.main.model.nosql.AdoptionApplication;
import com.pethaven.main.model.nosql.MedicalRecord;
import com.pethaven.main.model.nosql.Pet;
import com.pethaven.main.model.sql.Donation;
import com.pethaven.main.repository.nosql.AdoptionApplicationRepository;
import com.pethaven.main.repository.nosql.MedicalRecordRepository;
import com.pethaven.main.repository.nosql.PetRepository;
import com.pethaven.main.repository.sql.DonationRepository;
import com.pethaven.main.service.PdfReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private PdfReportService pdfReportService;

    @Autowired
    private PetRepository petRepository;

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private AdoptionApplicationRepository applicationRepository;

    @GetMapping("/medical/{petId}")
    public ResponseEntity<byte[]> getMedicalReport(@PathVariable String petId) {
        Optional<Pet> petOpt = petRepository.findById(petId);
        if (petOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        Pet pet = petOpt.get();
        MedicalRecord record = medicalRecordRepository.findByPetId(petId).orElse(null);

        byte[] pdfBytes = pdfReportService.generateMedicalHistoryPdf(record, pet);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(pet.getName() + "_medical_history.pdf")
                .build());

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/donation/{donationId}")
    public ResponseEntity<byte[]> getDonationReceipt(@PathVariable String donationId) {
        Optional<Donation> donationOpt = donationRepository.findById(donationId);
        if (donationOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        Donation donation = donationOpt.get();
        byte[] pdfBytes = pdfReportService.generateDonationReceiptPdf(donation);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("donation_receipt_" + donation.getInvoiceId() + ".pdf")
                .build());

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/shelter/{shelterId}")
    public ResponseEntity<byte[]> getShelterReport(@PathVariable String shelterId) {
        List<Pet> shelterPets = petRepository.findByShelterId(shelterId);
        String shelterName = shelterPets.isEmpty() ? "PetHaven Partner Shelter" : shelterPets.get(0).getShelterName();

        List<String> petIds = shelterPets.stream().map(Pet::getId).collect(Collectors.toList());
        List<AdoptionApplication> applications = applicationRepository.findAll().stream()
                .filter(app -> petIds.contains(app.getPetId()))
                .collect(Collectors.toList());

        byte[] pdfBytes = pdfReportService.generateShelterAnalyticsPdf(shelterName, shelterPets, applications);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(shelterName.replaceAll(" ", "_") + "_analytics.pdf")
                .build());

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/adopter/{adopterId}")
    public ResponseEntity<byte[]> getAdopterReport(@PathVariable String adopterId) {
        List<AdoptionApplication> applications = applicationRepository.findByAdopterId(adopterId);
        String adopterName = applications.isEmpty() ? "Sarah Mitchell" : applications.get(0).getAdopterName();

        byte[] pdfBytes = pdfReportService.generateAdoptionHistoryPdf(adopterName, applications);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("adopter_adoption_history.pdf")
                .build());

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
