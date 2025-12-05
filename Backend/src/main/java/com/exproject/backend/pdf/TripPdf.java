package com.exproject.backend.pdf;

import com.exproject.backend.trip.info.Trip;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trip_pdf")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripPdf {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", unique = true)
    private Trip trip;

    private String fileName;

    private String fileType;

    private String filePath;
}
