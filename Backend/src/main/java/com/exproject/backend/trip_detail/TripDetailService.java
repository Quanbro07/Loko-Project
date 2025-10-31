package com.exproject.backend.trip_detail;

import com.exproject.backend.trip_section.TripSection;
import com.exproject.backend.trip_section.TripSectionRepository;
import com.exproject.backend.trip_detail.dto.TripDetailRequest;
import com.exproject.backend.trip_detail.dto.TripDetailResponse;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TripDetailService {

    private final TripDetailRepository tripDetailRepository;
    private final TripSectionRepository tripSectionRepository;

    public TripDetailService(TripDetailRepository tripDetailRepository,
                             TripSectionRepository tripSectionRepository) {
        this.tripDetailRepository = tripDetailRepository;
        this.tripSectionRepository = tripSectionRepository;
    }

    public TripDetailResponse create(TripDetailRequest request) {
        TripSection section = tripSectionRepository.findById(request.getTripSectionId())
                .orElseThrow(() -> new RuntimeException("TripSection not found"));

        TripDetail detail = new TripDetail();
        detail.setTripSection(section);
        detail.setSequenceOrder(request.getSequenceOrder());
        detail.setStartTime(request.getStartTime());
        detail.setEndTime(request.getEndTime());
        detail.setTransportNote(request.getTransportNote());

        TripDetail saved = tripDetailRepository.save(detail);

        return new TripDetailResponse(
                saved.getId(),
                saved.getTripSection().getId(),
                null, // chưa gắn location
                saved.getSequenceOrder(),
                saved.getStartTime(),
                saved.getEndTime(),
                saved.getTransportNote()
        );
    }

    public List<TripDetailResponse> getBySection(Long tripSectionId) {
        return tripDetailRepository.findByTripSection_Id(tripSectionId)
                .stream()
                .map(d -> new TripDetailResponse(
                        d.getId(),
                        d.getTripSection().getId(),
                        null,
                        d.getSequenceOrder(),
                        d.getStartTime(),
                        d.getEndTime(),
                        d.getTransportNote()
                ))
                .collect(Collectors.toList());
    }

    public void delete(Long id) {
        tripDetailRepository.deleteById(id);
    }
}
