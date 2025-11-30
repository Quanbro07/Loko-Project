package com.exproject.backend.pdf;

import com.exproject.backend.trip.dto.TripRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/trip-pdf")
@RequiredArgsConstructor
public class TripPdfController {

    private final TripPdfService tripPdfService;

    @PostMapping(value = "/generate", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> generateTripPdf(@RequestBody TripRequest tripRequest) {

        byte[] pdfBytes = tripPdfService.generateTripPdf(tripRequest);
        String fileName = tripPdfService.buildFileName(tripRequest);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentLength(pdfBytes.length);
        headers.setContentDisposition(
                ContentDisposition
                        .attachment()
                        .filename(fileName)
                        .build()
        );

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
