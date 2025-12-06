package com.exproject.backend.pdf;

import com.exproject.backend.pdf.TripPdfRepository;
import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.trip.info.Trip;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
public class TripPdfService {

    private final TripPdfTemplateBuilder tripPdfTemplateBuilder;
    private final PdfGenerator pdfGenerator;
    private final TripPdfRepository tripPdfRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public byte[] generateTripPdf(TripRequest tripRequest) {
        String html = tripPdfTemplateBuilder.buildHtml(tripRequest);
        return pdfGenerator.generatePdfFromHtml(html);
    }

    public String savePdfToFileSystem(byte[] bytes, Long tripId) {
        try {
            String folderPath = uploadDir; // "uploads/trip-pdf/"
            File folder = new File(folderPath);
            if (!folder.exists()) folder.mkdirs();

            String fileName = "trip_" + tripId + ".pdf";
            String filePath = folderPath + fileName;

            FileOutputStream fos = new FileOutputStream(filePath);
            fos.write(bytes);
            fos.close();

            return filePath;

        } catch (Exception e) {
            throw new RuntimeException("Failed to save PDF", e);
        }
    }

    public TripPdf savePdfRecord(Trip trip, String filePath) {
        TripPdf pdf = TripPdf.builder()
                .trip(trip)
                .fileName("trip_" + trip.getId() + ".pdf")
                .fileType("application/pdf")
                .filePath(filePath)
                .build();

        return tripPdfRepository.save(pdf);
    }

    public byte[] downloadPdf(Long tripId) {
        TripPdf pdf = tripPdfRepository.findByTrip_Id(tripId);
        if (pdf == null)
            throw new RuntimeException("PDF not found for trip " + tripId);

        try {
            return Files.readAllBytes(Paths.get(pdf.getFilePath()));
        } catch (Exception e) {
            throw new RuntimeException("Cannot read PDF", e);
        }
    }
}
