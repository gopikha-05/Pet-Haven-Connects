package com.pethaven.main.service;

import com.pethaven.main.model.nosql.AdoptionApplication;
import com.pethaven.main.model.nosql.MedicalRecord;
import com.pethaven.main.model.nosql.Pet;
import com.pethaven.main.model.sql.Donation;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class PdfReportService {

    public byte[] generateMedicalHistoryPdf(MedicalRecord record, Pet pet) {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 18);
                contentStream.newLineAtOffset(50, 720);
                contentStream.showText("PetHaven Connect - Medical History");
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.newLineAtOffset(50, 680);
                contentStream.showText("Pet Name: " + pet.getName());
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Species: " + pet.getSpecies() + " | Breed: " + pet.getBreed());
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Age: " + pet.getAge() + " years | Gender: " + pet.getGender());
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Health Status: " + pet.getHealthStatus());
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
                contentStream.newLineAtOffset(50, 580);
                contentStream.showText("Allergies:");
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.newLineAtOffset(50, 555);
                String allergiesText = (record != null && record.getAllergies() != null) ? String.join(", ", record.getAllergies()) : "None";
                contentStream.showText(allergiesText);
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
                contentStream.newLineAtOffset(50, 500);
                contentStream.showText("Treatments Log:");
                contentStream.endText();

                int y = 475;
                if (record != null && record.getTreatments() != null && !record.getTreatments().isEmpty()) {
                    for (MedicalRecord.TreatmentEvent treatment : record.getTreatments()) {
                        if (y < 80) break;
                        contentStream.beginText();
                        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11);
                        contentStream.newLineAtOffset(50, y);
                        contentStream.showText(treatment.getDate() + " - " + treatment.getType());
                        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                        contentStream.newLineAtOffset(0, -15);
                        contentStream.showText("Administered by: " + treatment.getVet() + " | Notes: " + treatment.getNotes());
                        contentStream.endText();
                        y -= 35;
                    }
                } else {
                    contentStream.beginText();
                    contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                    contentStream.newLineAtOffset(50, y);
                    contentStream.showText("No treatments recorded yet.");
                    contentStream.endText();
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating Medical History PDF", e);
        }
    }

    public byte[] generateDonationReceiptPdf(Donation donation) {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 18);
                contentStream.newLineAtOffset(50, 720);
                contentStream.showText("PetHaven Connect - Donation Receipt");
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.newLineAtOffset(50, 670);
                contentStream.showText("Receipt ID: " + donation.getInvoiceId());
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Date: " + donation.getDate());
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Donor ID: " + donation.getUserId());
                contentStream.newLineAtOffset(0, -30);
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
                contentStream.showText("Contribution Details:");
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.newLineAtOffset(0, -25);
                contentStream.showText("Donated To: " + donation.getShelter());
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Amount Paid: INR " + donation.getAmount());
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Payment Method: " + donation.getMethod().toUpperCase());
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Status: " + donation.getStatus().toUpperCase());
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE), 11);
                contentStream.newLineAtOffset(50, 400);
                contentStream.showText("Thank you for your generosity! Your support helps us save lives.");
                contentStream.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating Donation Receipt PDF", e);
        }
    }

    public byte[] generateShelterAnalyticsPdf(String shelterName, List<Pet> pets, List<AdoptionApplication> applications) {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 18);
                contentStream.newLineAtOffset(50, 720);
                contentStream.showText("PetHaven Connect - Shelter Analytics Report");
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.newLineAtOffset(50, 680);
                contentStream.showText("Shelter Name: " + shelterName);
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Total Pets Managed: " + pets.size());
                long availableCount = pets.stream().filter(p -> p.getStatus().equals("available")).count();
                long adoptedCount = pets.stream().filter(p -> p.getStatus().equals("adopted")).count();
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Available for Adoption: " + availableCount);
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Adopted Pets: " + adoptedCount);
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Total Adoption Applications: " + applications.size());
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
                contentStream.newLineAtOffset(50, 560);
                contentStream.showText("Recent Applications Overview:");
                contentStream.endText();

                int y = 530;
                if (!applications.isEmpty()) {
                    for (AdoptionApplication app : applications) {
                        if (y < 80) break;
                        contentStream.beginText();
                        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                        contentStream.newLineAtOffset(50, y);
                        contentStream.showText("App ID: " + app.getId() + " | Pet Name: " + app.getPetName() + " | Adopter: " + app.getAdopterName());
                        contentStream.newLineAtOffset(0, -15);
                        contentStream.showText("Submitted: " + app.getSubmittedAt() + " | Status: " + app.getStatus().toUpperCase());
                        contentStream.endText();
                        y -= 35;
                    }
                } else {
                    contentStream.beginText();
                    contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                    contentStream.newLineAtOffset(50, y);
                    contentStream.showText("No applications received.");
                    contentStream.endText();
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating Shelter Analytics PDF", e);
        }
    }

    public byte[] generateAdoptionHistoryPdf(String adopterName, List<AdoptionApplication> applications) {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 18);
                contentStream.newLineAtOffset(50, 720);
                contentStream.showText("PetHaven Connect - Adoption History");
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.newLineAtOffset(50, 680);
                contentStream.showText("Adopter Profile: " + adopterName);
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Total Applications Lodged: " + applications.size());
                long approvedCount = applications.stream().filter(a -> a.getStatus().equalsIgnoreCase("approved")).count();
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Successful Adoptions: " + approvedCount);
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
                contentStream.newLineAtOffset(50, 580);
                contentStream.showText("Applications History:");
                contentStream.endText();

                int y = 550;
                if (!applications.isEmpty()) {
                    for (AdoptionApplication app : applications) {
                        if (y < 80) break;
                        contentStream.beginText();
                        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                        contentStream.newLineAtOffset(50, y);
                        contentStream.showText("Pet ID: " + app.getPetId() + " | Pet Name: " + app.getPetName() + " | Status: " + app.getStatus().toUpperCase());
                        contentStream.newLineAtOffset(0, -15);
                        contentStream.showText("Submitted: " + app.getSubmittedAt() + " | Last Update: " + app.getUpdatedAt());
                        contentStream.endText();
                        y -= 35;
                    }
                } else {
                    contentStream.beginText();
                    contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                    contentStream.newLineAtOffset(50, y);
                    contentStream.showText("No applications found in profile history.");
                    contentStream.endText();
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating Adoption History PDF", e);
        }
    }
}
