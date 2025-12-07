package com.exproject.backend.trip;


import com.exproject.backend.aiAPI.AIAPIService;
import com.exproject.backend.categorySyncStat.CategorySyncStatService;
import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.location_category.LocationCategoryRepository;
import com.exproject.backend.location_category.dto.LocationCategoryDTO;
import com.exproject.backend.location_category.info.LocationCategory;
import com.exproject.backend.location_img.LocationImg;
import com.exproject.backend.location_img.dto.LocationImgDTO;
import com.exproject.backend.makePlan.dto.MakePlanResponse;
import com.exproject.backend.pdf.TripPdf;
import com.exproject.backend.pdf.dto.TripPdfResponse;
import com.exproject.backend.province.ProvinceRepository;
import com.exproject.backend.province.info.Province;
import com.exproject.backend.route.RouteMapper;
import com.exproject.backend.route.dto.RoutePathResponse;
import com.exproject.backend.route.dto.RouteResponse;
import com.exproject.backend.route.dto.SectionRouteResponse;
import com.exproject.backend.trip.dto.ProgressUpdateDTO;
import com.exproject.backend.trip.dto.SimpleTripResponse;
import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.trip.dto.TripResponse;
import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.trip.info.TripStatus;
import com.exproject.backend.trip_detail.TripDetail;
import com.exproject.backend.trip_detail.dto.TripDetailRequest;
import com.exproject.backend.trip_history.TripHistoryService;
import com.exproject.backend.trip_history.dto.TripHistoryRequest;
import com.exproject.backend.trip_section.TripSection;
import com.exproject.backend.trip_section.TripSectionRepository;
import com.exproject.backend.trip_section.dto.TripSectionRequest;
import com.exproject.backend.user.info.User;
import com.exproject.backend.user.UserRepository;
import com.exproject.backend.utils.PolylineUltils;
import com.exproject.backend.weather.AlertWeatherRepository;
import com.exproject.backend.weather.WeatherMapper;
import com.exproject.backend.weather.WeatherService;
import com.exproject.backend.weather.dto.WeatherRequest;
import com.exproject.backend.weather.dto.WeatherResponse;
import com.exproject.backend.weather.info.AlertWeather;
import com.exproject.backend.weather.info.WeatherSection;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.RouteMatcher;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;

    private final UserRepository userRepository;

    private final LocationRepository locationRepository;

    private final CategorySyncStatService categorySyncStatService;

    private final TripMapper tripMapper;

    private final TripSectionRepository tripSectionRepository;

    private final TripHistoryService tripHistoryService;

    private final LocationCategoryRepository locationCategoryRepository;

    private final AlertWeatherRepository alertWeatherRepository;

    private final WeatherService weatherService;

    private final ProvinceRepository provinceRepository;

    private final AIAPIService aiAPIService;

    private final RouteMapper routeMapper;

    private final WeatherMapper weatherMapper;

    // * Tạo Full Trip
    //TODO: Handle: null routeReponse
    // TODO: có thể thêm ROLE param để check
    // TODO: thêm biến date hiện tại vào TripSection
    // TODO: Set biến đó vào khi createFullTrip
    @Transactional
    public Trip createFullTrip(Long userId,TripRequest tripRequest, RouteResponse routeResponse) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Handle RouteResponse null
        boolean hasRouteData = routeResponse != null && routeResponse.getSections() != null;
        System.out.println("HI#2");
        // Chỉ check khi routeReponse != null
        if (hasRouteData) {
            if(tripRequest.getTripSections().size() != routeResponse.getSections().size()) {
                throw new RuntimeException("Data mismatch: Section count does not match Routes");
            }
        }
        System.out.println("HI#3");
        Trip newTrip = new Trip(tripRequest,user);

        // Dùng vòng lặp Index để đồng bộ dữ liệu
        List<TripSectionRequest> sectionRequests = tripRequest.getTripSections();
        List<SectionRouteResponse> sectionRoutes = hasRouteData ? routeResponse.getSections() : null;

        System.out.println("HI#4");

        // Loop qua Trip Section Request
        for (int i = 0 ; i < sectionRequests.size() ; i++) {
            TripSectionRequest tripSectionRequest = sectionRequests.get(i);

            // Handle null
            SectionRouteResponse sectionRoute = (hasRouteData && sectionRoutes != null) ? sectionRoutes.get(i) : null;

            TripSection newSection = new TripSection(tripSectionRequest,newTrip.getStartDate());

            // Lấy trip Detail cùng route Path ra
            List<TripDetailRequest> tripDetailRequests = tripSectionRequest.getTripDetails();

            // Handle Null
            List<RoutePathResponse> routePaths = (sectionRoute != null) ? sectionRoute.getRoutePath() : null;

            if(routePaths != null) {
                if(tripDetailRequests.size() != routePaths.size()) {
            // Loop qua Trip Detail Request
            for(int j = 0 ; j < tripDetailRequests.size() ; j++) {
                TripDetailRequest tripDetailRequest = tripDetailRequests.get(j);

                // Handle null
                RoutePathResponse routePath = (routePaths != null) ? routePaths.get(j) : null;
                System.out.println("HI#8");
                // Lấy locaiton DTO ra
                LocationDTO locationDTO = tripDetailRequest.getLocation();

                // Lấy location
                Location location = locationRepository.findById(locationDTO.getId())
                        .orElseThrow(() -> new RuntimeException("Location not found"));

                // Logic: User chọn địa điểm này -> Hệ thống hiểu User đang quan tâm Tỉnh/Loại này
                categorySyncStatService.increaseCategorySyncStat(location.getId());
                /*// Loop qua location img
                for(LocationImgDTO imgDTO: locationDTO.getImgs()) {
                    // Them img mới
                    LocationImg newImg = new LocationImg(imgDTO);

                    // Add quan hệ 2 chiều vào
                    location.addLocationImg(newImg);
                }


                // Loop qua location categories
                for(LocationCategoryDTO categoryDTO: locationDTO.getCategories()) {
                    // Tìm category ể set quan hệ 2 chiều
                    LocationCategory existCategory = locationCategoryRepository
                            .findById(categoryDTO.getId())
                                    .orElseThrow(()-> new RuntimeException("Cateogry not Found"));

                    location.addLocationCategory(existCategory);
                }*/


                TripDetail newTripDetail = new TripDetail(tripDetailRequest);

                newTripDetail.addLocation(location);
                System.out.println("HI#10");
                // Handle Null
                if(routePath != null) {
                    String pathSegment = routePath.getPolyline();

                    if(pathSegment != null && !pathSegment.isEmpty()) {
                        System.out.println("HI#11");
                        String newPolyline = pathSegment;

                        newTripDetail.setRoutePolyline(newPolyline);
                        newTripDetail.setTime_second(routePath.getDurationSeconds());

                        newTripDetail.setDistance(routePath.getDistanceMeters());
                        System.out.println("HI#12");
                    }
                    else {
                        // Có object routePath nhưng path rỗng (điểm bắt đầu)
                        setDefaultRouteValues(newTripDetail);
                    }
                }
                else {
                    setDefaultRouteValues(newTripDetail);
                }

                newSection.addTripDetail(newTripDetail);
            }

            newTrip.addTripSection(newSection);

        }

        Trip savedTrip = tripRepository.save(newTrip);
        return savedTrip;
    }

    // Khi Trip đã hoàn thành
    public void completeTrip(Long tripId) {
        List<Trip> trips = tripRepository.findTripWithSections(tripId);

        if(trips.isEmpty()) {
            throw new RuntimeException("Trip not found");
        }

        Trip trip = trips.getFirst();

        List<TripSection> sectionsToFetch = trip.getTripSections();

        if(sectionsToFetch != null && !sectionsToFetch.isEmpty()) {
            tripSectionRepository.fetchDetailsForSections(sectionsToFetch);
        }

        // Handle đã Completed
        if(trip.getStatus() == TripStatus.COMPLETED) {
            throw new RuntimeException("Trip is already completed");
        }

        // Set Trip là hoàn thành
        trip.setStatus(TripStatus.COMPLETED);

        // Lấy User
        User user = trip.getUser();

        // Tạo Trip History Request để pass vào createTripHistory
        TripHistoryRequest tripHistoryRequest = new TripHistoryRequest();
        tripHistoryRequest.setUserId(user.getId());
        tripHistoryRequest.setTripId(trip.getId());

        // Gọi hàm tao trip HIstory
        tripHistoryService.createTripHistory(tripHistoryRequest);

        // Tìm các tỉnh mà User đã đi trong Trip này
        Set<Province> provinces = trip.getTripSections().stream()
                .flatMap(section -> section.getTripDetails().stream())
                .map(TripDetail::getLocation)
                .map(Location::getProvince)
                .collect(Collectors.toSet());

        // Update Province(tỉnh) mà User đã đi dựa trên Location
        for(Province province : provinces) {
            user.addVisitedProvince(province);
        }

        userRepository.save(user);
    }

    // Lấy Full Trip
    // TODO: Handle lấy route với Weather
    // TODO: trả về MakePlan Response
    // TODO: lấy ngày hiện tại chạy tới section đó
    // TODO: NẾu section đó ko có weather entity
    // TODO: tạo Weather Request gọi API get Weather
    // TODO: gắn vào DB và trả về
    @Cacheable(value = "full_trip", key = "#tripId")
    public MakePlanResponse getFullTrip(Long tripId) {
        // 1. Lấy Trip + Trip Section
        List<Trip> trips = tripRepository.findTripWithSections(tripId);

        if(trips.isEmpty()) {
            throw new RuntimeException("Trip not found");
        }

        Trip tripEntity = trips.getFirst();

        List<TripSection> sectionsToFetch = tripEntity.getTripSections();


        // 1.1 Lấy Alert Weather
        List<AlertWeather> alertWeathers = alertWeatherRepository.findAllByTripId(tripId);

        // Gắn lại để chạy DTO
        tripEntity.setAlertWeathers(alertWeathers);

        // 2. Fetch Detail
        if(sectionsToFetch != null && !sectionsToFetch.isEmpty()) {
            tripSectionRepository.fetchDetailsForSections(sectionsToFetch);
        }
        else {
            throw new RuntimeException("Trip Section not found");
        }

        // 2.1 Fetch Weather
        tripSectionRepository.fetchWeatherForSections(sectionsToFetch);

        // 3. Lấy Img + Categories
        List<Location> locationsToFetch = tripEntity.getTripSections().stream()
                .flatMap(sections->sections.getTripDetails().stream())
                .map(TripDetail::getLocation)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        // Ko Empty
        if(!locationsToFetch.isEmpty()) {
            locationRepository.fetchLocationImages(locationsToFetch);
            locationRepository.fetchLocationCategories(locationsToFetch);
        }


        // Tìm Province Đại diện cho Weather Request
        Long provinceId = sectionsToFetch.stream()
                .flatMap(s -> s.getTripDetails().stream())
                .map(d -> d.getLocation())
                .filter(Objects::nonNull)
                .map(loc -> loc.getProvince().getId()) // Giả sử Location có getProvince()
                .findFirst()
                .orElse(null);

        if(provinceId != null) {
            processWeatherForTripSection(tripEntity,sectionsToFetch,provinceId);
        }
        else {
            throw new RuntimeException("Province not found for Process Weather");
        }



        // *Response
        // Tạo Make Plan Response
        MakePlanResponse makePlanResponse = new MakePlanResponse();

        // Gắn vào Trip Response
        TripResponse tripResponse = tripMapper.toTripResponse(tripEntity);
        // Tạo RouteResponse
        RouteResponse routeResponse = routeMapper.toRouteResponse(sectionsToFetch);

        // Tạo Weather Response
        List<WeatherSection> validWeatherSections = sectionsToFetch.stream()
                .map(TripSection::getWeatherSection)
                .filter(Objects::nonNull) // <--- QUAN TRỌNG
                .collect(Collectors.toList());

        WeatherResponse weatherResponse = null;
        if(!validWeatherSections.isEmpty()) {
            weatherResponse = weatherMapper.toWeatherResponse(tripEntity,validWeatherSections);
        }

        // Set vào MakePlanResponse
        makePlanResponse.setWeather(weatherResponse);

        // Tạo PDF response
        // TODO: Set file pdf

        // TODO: set PDF
        //makePlanResponse.setPdf();
        if (tripEntity.getTripPdf() != null) {
            TripPdf pdf = tripEntity.getTripPdf();
            makePlanResponse.setPdf(
                    TripPdfResponse.builder()
                            .fileName(pdf.getFileName())
                            .downloadUrl(pdf.getFilePath())  // FE dùng cái này để gọi API download
                            .build()
            );
        }


        // Set giá trị
        makePlanResponse.setTripPlan(tripResponse);
        makePlanResponse.setRoute(routeResponse);

        makePlanResponse.setWeather(weatherResponse);



        return makePlanResponse;
    }

    // Nhồi Weather vào Trip + gọi API để lấy weather về
    public void processWeatherForTripSection(Trip trip, List<TripSection> sectionsToFetch, Long provinceId) {
        LocalDate today = LocalDate.now();
        LocalDate maxForcastDate = today.plusDays(3);
        LocalDate minForcastDate = today.minusDays(7);


        LocalDate tripStart = trip.getStartDate();
        LocalDate tripEnd = trip.getEndDate();


        List<TripSection> sectionsToUpdate = sectionsToFetch.stream()
                .filter(section -> {
                            LocalDate sectionDate = section.getDate();

                            if(sectionDate == null || tripStart == null || tripEnd == null) {
                                System.out.println("Date is null or tripStart is null or tripEnd is null");
                                System.out.println("SectionDate: " + sectionDate);
                                System.out.println("TripStart: " + tripStart);
                                System.out.println("TripEnd: " + tripEnd);
                                return false;
                            }

                            if(sectionDate.isBefore(tripStart) || sectionDate.isAfter(tripEnd)) {
                                return false;
                            }

                            if(sectionDate.isBefore(minForcastDate) || sectionDate.isAfter(maxForcastDate)) {
                                return false;
                            }

                            return weatherService.shouldFetchNewWeather(section.getWeatherSection());
                        }
                )
                .collect(Collectors.toList());

        if(sectionsToUpdate.isEmpty()) {
            return;
        }

        LocalDate startDate = sectionsToUpdate.get(0).getDate();
        LocalDate endDate = sectionsToUpdate.get(sectionsToUpdate.size() - 1).getDate();

        Province province = provinceRepository.findById(provinceId)
                .orElseThrow(() -> new RuntimeException("Province not found"));


        // Tạo Weather Request
        WeatherRequest weatherRequest = weatherService.buildWeatherRequest(trip, province,
                startDate,endDate);

        // Lấy response API thì AI service
        WeatherResponse response = aiAPIService.forecastWeather(weatherRequest);

        weatherService.createWeatherSection(trip,response,sectionsToUpdate);
    }

    // Hàm Update Progress
    @Transactional
    public void updateTripProgress(ProgressUpdateDTO progressUpdateDTO) {
        Trip trip = tripRepository.findById(progressUpdateDTO.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        trip.setCurrentTripSectionId(progressUpdateDTO.getCurrentTripSectionId());

        trip.setCurrentTripDetailId(progressUpdateDTO.getCurrentTripDetailId());
    }

    public Trip getTripEntity(Long tripId) {
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with id: " + tripId));
    }

    public Page<SimpleTripResponse> getAllTripSimple(User user, Pageable pageable) {
        Page<Trip> tripList = tripRepository.findAllByUserId(user.getId(),pageable);

        return tripList.map(this::toSimpleResponse);
    }

    // * Helper Function

    // Helper method để set giá trị mặc định cho gọn code
    private void setDefaultRouteValues(TripDetail detail) {
        detail.setRoutePolyline(null);
        detail.setTime_second(null);
        detail.setDistance(null);
    }

    public Long findProvinceIdFromSections(List<TripSection> sections) {
        if (sections == null || sections.isEmpty()) return null;

        return sections.stream()
                .flatMap(s -> s.getTripDetails().stream())
                .map(TripDetail::getLocation)
                .filter(Objects::nonNull)
                .map(loc -> loc.getProvince().getId())
                .findFirst()
                .orElse(null);
    }

    private SimpleTripResponse toSimpleResponse(Trip trip) {
        return SimpleTripResponse.builder()
                .tripId(trip.getId())
                .tripName(trip.getTripName())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .fromOperationTime(trip.getFromOperationTime())
                .toOperationTime(trip.getToOperationTime())
                .status(trip.getStatus())
                .createdAt(trip.getCreateAt())
                .build();
    }
}
