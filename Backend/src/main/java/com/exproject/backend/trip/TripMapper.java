package com.exproject.backend.trip;

import com.exproject.backend.location.Location;
import com.exproject.backend.location.dto.LocationResponse;
import com.exproject.backend.location_category.dto.LocationCategoryResponse;
import com.exproject.backend.location_category.info.LocationCategory;
import com.exproject.backend.location_img.LocationImg;
import com.exproject.backend.location_img.dto.LocationImgResponse;
import com.exproject.backend.trip.dto.TripResponse;
import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.trip_detail.TripDetail;
import com.exproject.backend.trip_detail.dto.TripDetailResponse;
import com.exproject.backend.trip_section.TripSection;
import com.exproject.backend.trip_section.dto.TripSectionResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class TripMapper {

    // Cấp 1
    public TripResponse toTripResponse(Trip trip) {
        if (trip == null) {
            return null;
        }
        TripResponse tripResponse = new TripResponse();

        // Set giá tri
        tripResponse.setTripId(trip.getId());
        tripResponse.setTripName(trip.getTripName());
        tripResponse.setStartDate(trip.getStartDate());
        tripResponse.setEndDate(trip.getEndDate());
        tripResponse.setNumAdult(trip.getNumAdult());
        tripResponse.setNumElder(trip.getNumElder());
        tripResponse.setNumChild(trip.getNumChild());
        tripResponse.setStatus(trip.getStatus());
        tripResponse.setCreateAt(trip.getCreateAt());

        List<TripSectionResponse> sectionResponses = trip.getTripSections().stream()
                .map(this::toTripSectionResponse)
                .collect(Collectors.toList());

        tripResponse.setTripSections(sectionResponses);

        return tripResponse;
    }


    // Cấp 2
    private TripSectionResponse toTripSectionResponse(TripSection tripSection) {
        if (tripSection == null) {
            return null;
        }

        TripSectionResponse tripSectionResponse = new TripSectionResponse();

        tripSectionResponse.setId(tripSection.getId());
        tripSectionResponse.setTripId(tripSection.getTrip().getId());
        tripSectionResponse.setDayNumber(tripSection.getDayNumber());
        tripSectionResponse.setTitle(tripSection.getTitle());

        List<TripDetailResponse> detailResponses = tripSection.getTripDetails().stream()
                .map(this::toTripDetailResponse)
                .collect(Collectors.toList());

        tripSectionResponse.setTripDetails(detailResponses);

        return tripSectionResponse;
    }


    // Cấp 3
    private TripDetailResponse toTripDetailResponse(TripDetail tripDetail) {
        if (tripDetail == null) {
            return null;
        }

        TripDetailResponse tripDetailResponse = new TripDetailResponse();
        tripDetailResponse.setId(tripDetail.getId());
        tripDetailResponse.setTripSectionId(tripDetail.getTripSection().getId());
        tripDetailResponse.setSequenceOrder(tripDetail.getSequenceOrder());
        tripDetailResponse.setStartTime(tripDetail.getStartTime());
        tripDetailResponse.setEndTime(tripDetail.getEndTime());
        tripDetailResponse.setTransportNote(tripDetail.getTransportNote());
        tripDetailResponse.setDescription(tripDetail.getDescription());

        Location locationEntity = tripDetail.getLocation();

        if (locationEntity != null) {
            tripDetailResponse.setLocationId(locationEntity.getId());

            LocationResponse locationResponse = toLocationDto(locationEntity);

            tripDetailResponse.setLocation(locationResponse);
        }

        return tripDetailResponse;
    }


    // Cấp 4
    private LocationResponse toLocationDto(Location location) {
        if(location == null) {
            return null;
        }
        LocationResponse locationResponse = new LocationResponse();

        locationResponse.setId(location.getId());
        locationResponse.setGgPlaceId(location.getGgPlaceId());
        locationResponse.setLocationName(location.getLocationName());
        locationResponse.setLatitude(location.getLatitude());
        locationResponse.setLongitude(location.getLongitude());
        locationResponse.setOpenTime(location.getOpenTime());
        locationResponse.setAvgVisitTime(location.getAvgVisitTime());
        locationResponse.setTicketPrice(location.getTicketPrice());

        // Map Province
        if(location.getProvince() != null) {
            locationResponse.setProvinceId(location.getProvince().getId());
            locationResponse.setProvinceName(location.getProvince().getProvinceName());
        }

        // Map Location Imgs
        List<LocationImgResponse> locationImgResponses = location.getLocationImgs().stream()
                .map(this::toLocationImgDto)
                .collect(Collectors.toList());

        locationResponse.setLocationImgs(locationImgResponses);

        // Map Location Categories
        List<LocationCategoryResponse> locationCategoryResponses = location.getLocationCategories().stream()
                .map(this::toLocationCategoryDto)
                .collect(Collectors.toList());

        locationResponse.setLocationCategories(locationCategoryResponses);

        return locationResponse;
    }


    // Cấp 5
    private LocationImgResponse toLocationImgDto(LocationImg locationImg) {
        if(locationImg == null) {
            return null;
        }
        LocationImgResponse locationImgResponse = new LocationImgResponse();

        locationImgResponse.setId(locationImg.getId());
        locationImgResponse.setImg_url(locationImg.getImgUrl());
        locationImgResponse.setDescription(locationImg.getDescription());

        return locationImgResponse;
    }

    private LocationCategoryResponse toLocationCategoryDto(LocationCategory locationCategory) {
        if(locationCategory == null) {
            return null;
        }
        LocationCategoryResponse locationCategoryResponse = new LocationCategoryResponse();

        locationCategoryResponse.setId(locationCategory.getId());
        locationCategoryResponse.setCategoryName(locationCategory.getLocationCategoryName());

        return locationCategoryResponse;
    }
}
