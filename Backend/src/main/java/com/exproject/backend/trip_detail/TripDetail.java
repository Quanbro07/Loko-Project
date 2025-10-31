package com.exproject.backend.trip_detail;

import com.exproject.backend.trip_section.TripSection;
import jakarta.persistence.*;

import java.time.LocalTime;

@Entity
@Table(name = "trip_detail")
public class TripDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_section_id", nullable = false)
    private TripSection tripSection;

    @Column(name = "sequence_order")
    private Integer sequenceOrder;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "transport_note")
    private String transportNote;

    public TripDetail() {
    }

    public Long getId() {
        return id;
    }

    public TripSection getTripSection() {
        return tripSection;
    }

    public void setTripSection(TripSection tripSection) {
        this.tripSection = tripSection;
    }

    public Integer getSequenceOrder() {
        return sequenceOrder;
    }

    public void setSequenceOrder(Integer sequenceOrder) {
        this.sequenceOrder = sequenceOrder;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getTransportNote() {
        return transportNote;
    }

    public void setTransportNote(String transportNote) {
        this.transportNote = transportNote;
    }
}
