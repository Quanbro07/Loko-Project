package com.exproject.backend.pdf;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/trip-pdf")
public class TripPdfController {

    private final TripPdfService tripPdfService;

    @GetMapping(value = "/download/{tripId}", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long tripId) {

        byte[] bytes = tripPdfService.downloadPdf(tripId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                ContentDisposition.inline().filename("trip_" + tripId + ".pdf").build()
        );

        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }
}
