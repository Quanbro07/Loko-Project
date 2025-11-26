package com.exproject.backend.aiAPI;

import com.exproject.backend.aiAPI.dto.RawLocationDTO;
import com.exproject.backend.categorySyncStat.dto.CategorySyncStatDTO;
import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationMapper;
import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.location_category.LocationCategoryRepository;
import com.exproject.backend.location_category.info.LocationCategory;
import com.exproject.backend.location_img.LocationImg;
import com.exproject.backend.location_img.LocationImgService;
import com.exproject.backend.province.ProvinceRepository;
import com.exproject.backend.province.info.Province;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import com.exproject.backend.makePlan.dto.MakePlanRequest;
import com.exproject.backend.trip.dto.TripRequest;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AIAPIService {

    private final PythonAPIConfig pythonAPIConfig;

    private final RestTemplate restTemplate;

    private final LocationCategoryRepository locationCategoryRepository;

    private final ProvinceRepository provinceRepository;

    private final LocationImgService locationImgService;

    private final LocationRepository locationRepository;

    private final LocationMapper locationMapper;

    // Gọi Api lấy location
    public List<Location> getLocations(List<CategorySyncStatDTO> categorySyncStatDTOList) {
        // URL
        String getLocationUrl = pythonAPIConfig.getBaseUrl() + pythonAPIConfig.getVersionUrl() +
                pythonAPIConfig.getGetLocationUrl();

        ResponseEntity<List<RawLocationDTO>> rawLocationListResponse = restTemplate.exchange(
                getLocationUrl,
                HttpMethod.POST,
                new HttpEntity<>(categorySyncStatDTOList),
                new ParameterizedTypeReference<List<RawLocationDTO>>() {}
        );
        List<RawLocationDTO> rawLocationDTOList = rawLocationListResponse.getBody();

        // Rỗng
        if(rawLocationDTOList.isEmpty()) {
            return new ArrayList<>();
        }

        List<Location> locationEntities = new ArrayList<>();

        // Loop qua để nhồi các mối quan hệ Object vào Location
        for(RawLocationDTO rawLocationDTO : rawLocationDTOList) {
            Optional<Province> provinceOpt = provinceRepository.findById(rawLocationDTO.getProvinceId());

            // Province Id không hợp lệ
            if(provinceOpt.isEmpty()) {
                System.err.println("Bỏ qua location: Không tìm thấy Province với ID: "
                        + rawLocationDTO.getProvinceId());

                continue;
            }

            Province province = provinceOpt.get();

            List<LocationCategory> categories = locationCategoryRepository.
                    findAllById(rawLocationDTO.getCategoryIds());

            if(categories.size() != rawLocationDTO.getCategoryIds().size()) {
                // Log cảnh báo nếu có category ID không tìm thấy
                System.err.println("Cảnh báo: Một số category ID không tìm thấy cho location: "
                        + rawLocationDTO.getGgPlaceId());
            }

            Location location = Location.builder()
                    .ggPlaceId(rawLocationDTO.getGgPlaceId())
                    .locationName(rawLocationDTO.getLocationName())
                    .latitude(rawLocationDTO.getLatitude())
                    .longitude(rawLocationDTO.getLongitude())
                    .openTime(rawLocationDTO.getOpenTime())
                    .closeTime(rawLocationDTO.getCloseTime())
                    .avgVisitTime(rawLocationDTO.getAvgVisitTime())
                    .ticketPrice(rawLocationDTO.getTicketPrice())
                    .averageRating(rawLocationDTO.getAverageRating())
                    .reviewCount(rawLocationDTO.getReviewCount())
                    .updateAt(LocalDateTime.now()) // Set thời gian cập nhật
                    .province(province) // <-- Gán object Province đã tra cứu
                    .locationCategories(new ArrayList<>(categories)) // <-- Gán List object Category đã tra cứu
                     //reviews Khởi tạo rỗng
                    .locationImgs(new ArrayList<>()) // ** Quan trọng chưa Set img
                    .build();

            List<LocationImg> locationImgList =  locationImgService.
                    createLocationImgs(rawLocationDTO.getRawImgs(), location);

            locationEntities.add(location);
        }

        return locationEntities;
    }

    // TODO: Thêm 1 function gọi api makeplan bên AI service
    // TODO: param là MakePlanRequest + Location + Location user dã đi tỉnh đó
    // TODO: return phải trả về TripResponse class/record
    // gọi AI sinh TripRequest từ MakePlanRequest
        public TripRequest generateTripPlan(MakePlanRequest makePlanRequest) {
            String url = pythonAPIConfig.getBaseUrl() + pythonAPIConfig.getVersionUrl() +
                    pythonAPIConfig.getMakePlanUrl();

            System.out.println(url);

            ResponseEntity<TripRequest> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(makePlanRequest),
                    TripRequest.class
            );

            return response.getBody();
        }

    @Transactional
    public List<LocationDTO> convertRawToLocationDTO(List<RawLocationDTO> rawLocations) {
        List<Location> locationEntities = new ArrayList<>();

        // Loop qua để nhồi các mối quan hệ Object vào Location
        for(RawLocationDTO rawLocationDTO : rawLocations) {
            Optional<Province> provinceOpt = provinceRepository.findById(rawLocationDTO.getProvinceId());

            // Province Id không hợp lệ
            if(provinceOpt.isEmpty()) {
                System.err.println("Bỏ qua location: Không tìm thấy Province với ID: "
                        + rawLocationDTO.getProvinceId());

                continue;
            }

            Province province = provinceOpt.get();

            List<LocationCategory> categories = locationCategoryRepository.
                    findAllById(rawLocationDTO.getCategoryIds());


            if(categories.size() != rawLocationDTO.getCategoryIds().size()) {
                // Log cảnh báo nếu có category ID không tìm thấy
                System.err.println("Cảnh báo: Một số category ID không tìm thấy cho location: "
                        + rawLocationDTO.getGgPlaceId());
            }


            Location location = Location.builder()
                    .ggPlaceId(rawLocationDTO.getGgPlaceId())
                    .locationName(rawLocationDTO.getLocationName())
                    .latitude(rawLocationDTO.getLatitude())
                    .longitude(rawLocationDTO.getLongitude())
                    .openTime(rawLocationDTO.getOpenTime())
                    .closeTime(rawLocationDTO.getCloseTime())
                    .avgVisitTime(rawLocationDTO.getAvgVisitTime())
                    .ticketPrice(rawLocationDTO.getTicketPrice())
                    .averageRating(rawLocationDTO.getAverageRating())
                    .reviewCount(rawLocationDTO.getReviewCount())
                    .updateAt(LocalDateTime.now()) // Set thời gian cập nhật
                    .province(province) // <-- Gán object Province đã tra cứu
                    .locationCategories(new ArrayList<>(categories)) // <-- Gán List object Category đã tra cứu
                    //reviews Khởi tạo rỗng
                    .locationImgs(new ArrayList<>()) // ** Quan trọng chưa Set img
                    .build();


            List<LocationImg> locationImgList =  locationImgService.
                    createLocationImgs(rawLocationDTO.getRawImgs(), location);



            locationEntities.add(location);
        }

        locationRepository.saveAll(locationEntities);


        List<LocationDTO> locationDTOList = locationEntities.stream()
                .map(locationMapper::toLocationDTO)
                .toList();


        return locationDTOList;
    }
}
