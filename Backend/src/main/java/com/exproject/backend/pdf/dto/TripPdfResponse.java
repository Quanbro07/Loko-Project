package com.exproject.backend.pdf.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripPdfResponse {
    private String fileName;
    private String downloadUrl;
}
