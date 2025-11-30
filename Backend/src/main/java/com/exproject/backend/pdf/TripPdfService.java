package com.exproject.backend.pdf;

import com.exproject.backend.trip.dto.TripRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;

@Service
@RequiredArgsConstructor
public class TripPdfService {

    private final TripPdfTemplateBuilder tripPdfTemplateBuilder;
    private final PdfGenerator pdfGenerator;


    public byte[] generateTripPdf(TripRequest tripRequest) {
        String html = tripPdfTemplateBuilder.buildHtml(tripRequest);
        return pdfGenerator.generatePdfFromHtml(html);
    }

    public String savePdfFile(byte[] pdfBytes, Long tripId) {
        try {
            String folderPath = "uploads/trip-pdf/";
            File folder = new File(folderPath);

            if (!folder.exists()) {
                folder.mkdirs();
            }

            String filePath = folderPath + "trip_" + tripId + ".pdf";

            FileOutputStream fos = new FileOutputStream(filePath);
            fos.write(pdfBytes);
            fos.close();

            return filePath;
        } catch (Exception e) {
            throw new RuntimeException("Failed to save PDF file", e);
        }
    }

    public String buildFileName(TripRequest tripRequest) {
        String base = tripRequest.getTripName() != null
                ? tripRequest.getTripName().trim().replaceAll("\\s+", "_")
                : "trip_plan";

        return base + ".pdf";
    }
}
