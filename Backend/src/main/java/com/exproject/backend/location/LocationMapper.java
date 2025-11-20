package com.exproject.backend.location;

import com.exproject.backend.aiAPI.dto.RawLocationDTO;
import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.location_category.dto.LocationCategoryDTO;
import com.exproject.backend.location_category.info.LocationCategory;
import com.exproject.backend.location_img.LocationImg;
import com.exproject.backend.location_img.dto.LocationImgDTO;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class LocationMapper {
    public LocationDTO toLocationDTO(Location location) {
        if(location == null) {
            return null;
        }

        LocationDTO dto = new LocationDTO();

        dto.setGgPlaceId(location.getGgPlaceId());
        dto.setLocationName(location.getLocationName());
        dto.setLatitude(location.getLatitude());
        dto.setLongitude(location.getLongitude());
        dto.setOpenTime(location.getOpenTime());
        dto.setAvgVisitTime(location.getAvgVisitTime());
        dto.setTicketPrice(location.getTicketPrice());
        dto.setAverageRating(location.getAverageRating());
        dto.setReviewCount(location.getReviewCount());
        dto.setProvinceId(location.getProvince().getId());

        List<LocationCategoryDTO> categoryDTO = location.getLocationCategories().stream()
                .map(this::toCategoryDTO)
                .collect(Collectors.toList());

        dto.setCategories(categoryDTO);

        List<LocationImgDTO> imgDTO = location.getLocationImgs().stream()
                .map(this::toLocationImgDTO)
                .collect(Collectors.toList());

        dto.setImgs(imgDTO);

        return dto;
    }

    private LocationCategoryDTO toCategoryDTO(LocationCategory locationCategory) {
        if(locationCategory == null) {
            return null;
        }

        LocationCategoryDTO dto = new LocationCategoryDTO();

        dto.setId(locationCategory.getId());
        dto.setCategoryName(locationCategory.getLocationCategoryName());

        return dto;
    }

    private LocationImgDTO toLocationImgDTO(LocationImg locationImg) {
        if(locationImg == null) {
            return null;
        }

        LocationImgDTO dto = new LocationImgDTO();

        dto.setId(locationImg.getId());
        dto.setImg_url(locationImg.getImgUrl());
        dto.setDescription(locationImg.getDescription());

        return dto;
    }
}
