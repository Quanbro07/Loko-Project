package com.exproject.backend.trip_detail;

import com.exproject.backend.location.Location;
import com.exproject.backend.trip_detail.dto.TripDetailRequest;
import com.exproject.backend.trip_section.TripSection;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "trip_detail")
public class TripDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_section_id", nullable = false)
    private TripSection tripSection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(name = "sequence_order")
    private Integer sequenceOrder;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "transport_note")
    private String transportNote;

    @Column(name = "description")
    private String description;



    public TripDetail(TripDetailRequest tripDetailRequest, Location location) {

        this.location = location;
        this.sequenceOrder = tripDetailRequest.getSequenceOrder();
        this.startTime = tripDetailRequest.getStartTime();
        this.endTime = tripDetailRequest.getEndTime();
        this.transportNote = tripDetailRequest.getTransportNote();
        this.description = tripDetailRequest.getDescription();
    }
}
