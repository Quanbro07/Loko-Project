package com.exproject.backend.pdf;

import com.exproject.backend.trip.info.Trip;
import jakarta.persistence.*;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "trip_pdf")
public class TripPdf {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", unique = true)
    private Trip trip;

    @Column(name = "file_path")
    private String filePath;

    @Lob
    @Column(name = "file_data")
    private byte[] fileData; // nếu muốn lưu dạng BLOB (optional)
}
