package com.exproject.backend.makePlan;

import java.time.LocalDate;

import com.exproject.backend.province.ProvinceRepository;
import com.exproject.backend.province.info.Province;
import com.exproject.backend.trip.TripMapper;
import com.exproject.backend.trip_section.TripSection;
import com.exproject.backend.user.UserRepository;
import com.exproject.backend.user.info.User;
import com.exproject.backend.user.info.Role;
import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.pdf.dto.TripPdfResponse;
import com.exproject.backend.pdf.TripPdf;
import com.exproject.backend.pdf.TripPdfService;
import com.exproject.backend.aiAPI.AIAPIService;
import com.exproject.backend.hobby.info.EHobby;
import com.exproject.backend.hobby.info.HobbyCategoryMapping;
import com.exproject.backend.location.Location;
import com.exproject.backend.location.LocationMapper;
import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.location.LocationService;
import com.exproject.backend.location.dto.LocationDTO;
import com.exproject.backend.location.dto.LocationIdDTO;
import com.exproject.backend.location_category.dto.LocationCategoryDTO;
import com.exproject.backend.location_category.info.ELocationCategory;
import com.exproject.backend.makePlan.dto.*;
import com.exproject.backend.route.RouteService;
import com.exproject.backend.route.dto.*;
import com.exproject.backend.trip.TripService;
import com.exproject.backend.trip.dto.TripRequest;
import com.exproject.backend.trip.dto.TripResponse;
import com.exproject.backend.trip_detail.dto.TripDetailRequest;
import com.exproject.backend.trip_section.dto.TripSectionRequest;
import com.exproject.backend.weather.WeatherMapper;
import com.exproject.backend.weather.WeatherService;
import com.exproject.backend.weather.dto.WeatherRequest;
import com.exproject.backend.weather.dto.WeatherRequestFE;
import com.exproject.backend.weather.dto.WeatherResponse;
import com.exproject.backend.weather.info.WeatherSection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MakePlanService {
    private final UserRepository userRepository;

    private final LocationService locationService;

    private final LocationMapper locationMapper;

    private final AIAPIService aiapiService;

    private final LocationRepository locationRepository;

    private final TripService tripService;

    private final WeatherService weatherService;

    private final RouteService routeService;

    private final TripPdfService tripPdfService;

    private final ProvinceRepository provinceRepository;

    private final TripMapper tripMapper;

    private final WeatherMapper weatherMapper;

    // ** Make Plan
    @Transactional(readOnly = true)
    public TripRequest makePlan(MakePlanRequest request, Long userId) {

        // Map Hobby -> categories
        EHobby hobby = request.getHobby();

        if (hobby == null) {
            throw new RuntimeException("Hobby must not be null");
        }

        List<ELocationCategory> categories =
                HobbyCategoryMapping.getCategories(hobby);

        if (categories.isEmpty()) {
            throw new RuntimeException("No category mapping for hobby: " + hobby);
        }

        // Province
        if (request.getProvince() == null) {
            throw new RuntimeException("Province must not be null");
        }

        Long provinceId = (long) (request.getProvince().ordinal() + 1);

        // Collect locations
        List<LocationDTO> locationDTOS = new ArrayList<>();

        for (ELocationCategory cate : categories) {

            Long categoryId = (long) (cate.ordinal() + 1);

            System.out.println(cate.name() + ": " + categoryId);

            List<LocationDTO> topLocations =
                    locationService.getTopLocations(provinceId, categoryId);

            locationDTOS.addAll(topLocations);
        }

        if (locationDTOS.isEmpty()) {
            throw new RuntimeException("Không tìm thấy location phù hợp cho hobby: " + hobby);
        }

        // Set Location
        request.setLocations(locationDTOS);

        // GỌi hàm tìm tất cả visited location
        List<LocationIdDTO> visitedLocation = locationService.getVisitedLocations(userId);

        // Set visitedLocation
        request.setVisitedLocations(visitedLocation);

        List<LocationIdDTO> rejectLocations = new ArrayList<>();
        // Lấy reject Locations
        if(request.getRejectedLocations() != null) {
            rejectLocations.addAll(request.getRejectedLocations());
        }

        // Set reject Locations dù có hay không
        request.setRejectedLocations(rejectLocations);

        // Gọi AI server -> trả TripRequest
        TripRequest tripRequest = aiapiService.generateTripPlan(request);

        if (tripRequest == null) {
            throw new RuntimeException("AI service returned null TripRequest");
        }

        return tripRequest;
    }

    // ** Regenerate Plan  Some Part
    @Transactional(readOnly = true)
    public RegeneratePlanPartResponse regeneratePlanPart(RegeneratePlanPartRequest request) {
        // List chứa các TempID/DetailID bị lỗi
        List<Long> failedTripDetailIds = new ArrayList<>();

        Set<Long> rejectedDetailIds = request.getRejectedDetail().stream()
                .map(RejectedPlanPartDTO::getTripDetailId)
                .collect(Collectors.toSet());

        Set<Long> excludedLocationIds = request.getRejectedDetail().stream()
                .map(RejectedPlanPartDTO::getLocationId)
                .collect(Collectors.toSet());

        TripRequest currentTrip = request.getCurrentTrip();

        // Add các location ĐANG CÓ trong trip (mà không bị reject) vào list loại trừ
        for(TripSectionRequest section : currentTrip.getTripSections()) {
            for(TripDetailRequest detail : section.getTripDetails()) {
                // Nếu detail này KHÔNG nằm trong danh sách reject ->
                // Nghĩa là nó được giữ lại
                if (!rejectedDetailIds.contains(detail.getTempId())) {
                    excludedLocationIds.add(detail.getLocation().getId());
                }
            }
        }

        System.out.println(excludedLocationIds);

        Map<Long, List<LocationDTO>> provinceLocationDtosCache = new HashMap<>();

        // Logic chính
        for(TripSectionRequest section: currentTrip.getTripSections()) {

            for(int i = 0 ; i < section.getTripDetails().size(); i++) {

                TripDetailRequest detail = section.getTripDetails().get(i);

                // Neu Detail khong nằm trong rejected detail thì bỏ qua
                if(!rejectedDetailIds.contains(detail.getTempId())) {
                    continue;
                }

                LocationDTO rejected_location = detail.getLocation();

                Long provinceId = rejected_location.getProvinceId();

                // OPTIMIZATION: Chỉ fetch DB nếu chưa có trong cache Map
                // --- OPTIMIZATION: Fetch & Map ngay lập tức ---
                if (!provinceLocationDtosCache.containsKey(provinceId)) {
                    // Fetch Entity (Có Category)
                    List<Location> entities = locationRepository.findAllByProvince(provinceId);

                    // Map sang DTO 1 lần duy nhất ở đây
                    // Dù có dính N+1 query lấy ảnh thì cũng chỉ bị 1 lần cho cả list
                    List<LocationDTO> dtos = entities.stream()
                            .map(locationMapper::toLocationDTO)
                            .collect(Collectors.toList());

                    provinceLocationDtosCache.put(provinceId, dtos);
                }

                // Lấy List DTO từ cache
                List<LocationDTO> sourceLocationDTOs = provinceLocationDtosCache.get(provinceId);

                // Lấy Set categories ra
                Set<Long> categoryIds = rejected_location.getCategories().stream()
                        .map(LocationCategoryDTO::getId)
                        .collect(Collectors.toSet());

                // Log ra check thử
                System.out.println("Đang tìm thay thế cho ID: " + rejected_location.getId());
                System.out.println("Danh sách bị loại trừ hiện tại: " + excludedLocationIds);

                // Tìm start và end (Neighbors)
                LocationDTO start = (i > 0) ? section.getTripDetails().get(i-1).getLocation() : null;
                LocationDTO end = (i < section.getTripDetails().size() - 1) ? section.getTripDetails().get(i+1).getLocation() : null;

                // Tìm candidate phù hơp
                List<LocationDTO> candidates = locationService.
                        getTopReplacementLocations(
                                sourceLocationDTOs,
                                categoryIds,
                                rejected_location.getOpenTime(),
                                rejected_location.getCloseTime(),
                                excludedLocationIds);

                // Tìm best dựa trên nó
                LocationDTO best = locationService.getBestReplacementLocations(start,candidates,end);

                // Có địa điểm
                if(best != null) {
                    // Thêm vào để không lấy lại địa điểm đó
                    excludedLocationIds.add(best.getId());

                    // Set Location mới vào
                    detail.setLocation(best);

                    // Generate Activity/Descrption
                    Set<String> cateNames = best.getCategories().stream()
                            .map(LocationCategoryDTO::getCategoryName)
                            .collect(Collectors.toSet());

                    String autoDescription = generateActivityDescription(best.getLocationName(), cateNames);

                    // Set vào field description (activity)
                    detail.setDescription(autoDescription);
                }
                else {
                    failedTripDetailIds.add(detail.getTempId());
                }
            }
        }

        // Builder
        RegeneratePlanPartResponse response = RegeneratePlanPartResponse.builder()
                .newTrip(currentTrip)
                .failedTripDetailIds(failedTripDetailIds)
                .build();


        return response;
    }

    // Generate Full Plan
    // Gộp vào make plan luôn
    /*@Transactional(readOnly = true)
    public TripRequest regeneratePlanFull(RegeneratePlanFullRequest request,Long userId) {
        MakePlanRequest makePlaneRequest = request.getMakePlanRequest();

        EHobby hobby = makePlaneRequest.getHobby();
        if(hobby == null) {
            throw new RuntimeException("Hobby must not be null");
        }

        List<ELocationCategory> categories = HobbyCategoryMapping.getCategories(hobby);

        if(categories.isEmpty()) {
            throw new RuntimeException("No category mapping for hobby: " + hobby);
        }

        if(makePlaneRequest.getProvince() == null) {
            throw new RuntimeException("Province must not be null");
        }

        Long provinceId = (long) (makePlaneRequest.getProvince().ordinal() + 1);

        List<LocationDTO> locationDTOs = new ArrayList<>();

        for(ELocationCategory category : categories) {
            Long categoryId = (long) (category.ordinal() + 1);

            List<LocationDTO> topLocations =
                    locationService.getTopLocations(provinceId, categoryId);

            locationDTOs.addAll(topLocations);
        }

        if(locationDTOs.isEmpty()) {
            throw new RuntimeException("Cannot find suitable locations for hobby: " + hobby);
        }

        makePlaneRequest.setLocations(locationDTOs);

        // GỌi hàm tìm tất cả visited location
        List<LocationIdDTO> visitedLocation = locationService.getVisitedLocations(userId);

        // Set visitedLocation
        makePlaneRequest.setVisitedLocations(visitedLocation);

        // Gọi API regenerateFull
        TripRequest tripRequest = aiapiService.regenerateTripPlan(request);

        if(tripRequest == null) {
            throw new RuntimeException("AI service returned null TripRequest");
        }

        return tripRequest;
    }*/

    // TODO: CONFIRM MAKEPLAN
    @Transactional(rollbackFor = Exception.class)
    public MakePlanResponse confirmMakePlan(ConfirmPlanRequest confirmPlanRequest,Long userId) {

        TripRequest tripRequest = confirmPlanRequest.getTripRequest();

        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        // TODO: Handle VIP/USER
        RouteResponse routeResponse = null;
        if(isVIP(user)) {
            // convert to Route Request
            RouteRequest routeRequest = convertToRouteRequest(tripRequest);

            // Gọi api route
            routeResponse = routeService.getRoute(routeRequest);

        }

        // Gọi hàm create full plan
        // TODO: Handle routeResponse null
        Trip tripEntity = tripService.createFullTrip(userId, tripRequest, routeResponse);


        // Lấy provinceId
        Long provinceId = tripService.findProvinceIdFromSections(tripEntity.getTripSections());

        if(provinceId != null) {
            System.out.println("Zo check provinceId thành cộng");
            // Hàm này sẽ tự check ngày, gọi API AI, lưu DB
            // VÀ QUAN TRỌNG: Nó phải set ngược lại WeatherSection vào tripEntity.getTripSections()
            tripService.processWeatherForTripSection(tripEntity, tripEntity.getTripSections(), provinceId);
        }

        List<TripSection> sectionsToFetch = tripEntity.getTripSections();

        // Tạo Weather Response
        List<WeatherSection> validWeatherSections = sectionsToFetch.stream()
                .map(TripSection::getWeatherSection)
                .filter(Objects::nonNull) // <--- QUAN TRỌNG
                .collect(Collectors.toList());

        WeatherResponse weatherResponse = null;
        if(!validWeatherSections.isEmpty()) {
            weatherResponse = weatherMapper.toWeatherResponse(tripEntity,validWeatherSections);
        }

        // Tạo lại Trip Response
        TripResponse tripResponse = tripMapper.toTripResponse(tripEntity);

        // Tạo Make plan Response
        MakePlanResponse makePlanResponse = new MakePlanResponse();

        // Set vào DTO
        makePlanResponse.setTripPlan(tripResponse);


        makePlanResponse.setWeather(weatherResponse);

        makePlanResponse.setRoute(routeResponse);

        if (isVIP(user)) {


            byte[] pdfBytes = tripPdfService.generateTripPdf(tripRequest);
            // Lưu PDF vào trip mối quan hệ 1:1
            String filePath = tripPdfService.savePdfToFileSystem(pdfBytes, tripResponse.getTripId());

            TripPdf tripPdf = tripPdfService.savePdfRecord(tripEntity, filePath);

            TripPdfResponse pdfResponse = TripPdfResponse.builder()
                    .fileName(tripPdf.getFileName())
                    .downloadUrl(tripPdf.getFilePath())
                    .build();

            makePlanResponse.setPdf(pdfResponse);
        }
        else {
            makePlanResponse.setPdf(null);
        }
        // TODO: Chỉnh lại TripPDFResponse  
        //makePlanResponse.setPdf();


        return makePlanResponse;
    }

    // * Helper Function

    private boolean isVIP(User user) {
        return user.getRole() == Role.VIP
                && user.getVipEndDate() != null
                && user.getVipEndDate().isAfter(LocalDate.now());
    }


    private RouteRequest convertToRouteRequest(TripRequest tripRequest) {
        RouteRequest routeRequest = new RouteRequest();
        routeRequest.setMode("drive");

        List<TripSectionRouteRequest> tripSectionRouteRequests = tripRequest.getTripSections().stream()
                .map(this::convertToTripSectionRouteRequest)
                .toList();
        
        routeRequest.setTripSectionRequests(tripSectionRouteRequests);
        
        return routeRequest;

    }

    private TripSectionRouteRequest convertToTripSectionRouteRequest(TripSectionRequest tripSectionRequest) {
        TripSectionRouteRequest tripDetailRouteRequest = new TripSectionRouteRequest();
        tripDetailRouteRequest.setDayNumber(tripSectionRequest.getDayNumber());

        List<TripDetailRouteRequest> tripDetailRouteResponses = tripSectionRequest.getTripDetails().stream()
                .map(this::convertToTripDetailRouteRequest)
                .toList();

        tripDetailRouteRequest.setTripDetailRoutes(tripDetailRouteResponses);
        
        return tripDetailRouteRequest;
    }

    private TripDetailRouteRequest convertToTripDetailRouteRequest(TripDetailRequest tripDetailRequest) {
        TripDetailRouteRequest tripDetailRouteRequest = new TripDetailRouteRequest();
        tripDetailRouteRequest.setSequenceOrder(tripDetailRequest.getSequenceOrder());

        LocationRoute locationRoute = new LocationRoute();

        LocationDTO location = tripDetailRequest.getLocation();

        locationRoute.setLocationId(location.getId());

        locationRoute.setLatitude(location.getLatitude());

        locationRoute.setLongitude(location.getLongitude());

        tripDetailRouteRequest.setLocationRoute(locationRoute);

        return tripDetailRouteRequest;
    }


    private String generateActivityDescription(String locationName, Set<String> categoryNames) {
        // 1. Làm sạch tên địa điểm (nếu data có rác kiểu "TOP 1", "HOT", etc.)
        // Ví dụ: "Highlands (TOP 1)" -> "Highlands"
        String cleanName = locationName.replaceAll("\\(TOP \\d+\\)", "")
                .replaceAll("\\(.*?\\)", "") // Bỏ nội dung trong ngoặc đơn bất kỳ
                .trim();

        // 2. Duyệt qua các category để tìm mẫu câu phù hợp
        // Lưu ý: Priority (Thứ tự ưu tiên). Nếu địa điểm vừa là CAFE vừa là RESTAURANT,
        // vòng lặp gặp cái nào trước sẽ return cái đó.

        for (String cat : categoryNames) {
            // Đảm bảo so sánh không phân biệt hoa thường
            switch (cat.toUpperCase()) {
                // --- ĂN UỐNG ---
                case "CAFE":
                    return "Thưởng thức đồ uống và thư giãn tại " + cleanName;
                case "RESTAURANT":
                    return "Dùng bữa và thưởng thức ẩm thực tại " + cleanName;
                case "SNACK":
                    return "Khám phá các món ăn vặt hấp dẫn tại " + cleanName;
                case "SPECIALITY":
                    return "Thưởng thức và mua sắm đặc sản tại " + cleanName;

                // --- VUI CHƠI / GIẢI TRÍ ---
                case "AMUSEMENT_WATER_PARK":
                    return "Vui chơi giải trí hết mình tại " + cleanName;
                case "ZOO":
                    return "Tham quan và khám phá thế giới động vật tại " + cleanName;
                case "AQUARIUM":
                    return "Khám phá đại dương thu nhỏ tại " + cleanName;
                case "NIGHTLIFE":
                    return "Trải nghiệm không khí sôi động về đêm tại " + cleanName;

                // --- MUA SẮM / CHỢ ---
                case "NIGHT_MARKET":
                    return "Dạo chơi, ăn uống và mua sắm tại chợ đêm " + cleanName;
                case "MARKET":
                    return "Tham quan và mua sắm tại chợ " + cleanName;

                // --- VĂN HÓA / SỰ KIỆN ---
                case "CULTURE_PERFORMANCE":
                    return "Thưởng thức chương trình biểu diễn nghệ thuật tại " + cleanName;
                case "FESTIVAL":
                    return "Hòa mình vào không khí lễ hội tại " + cleanName;

                // --- LƯU TRÚ ---
                case "HOTEL":
                    return "Check-in và nghỉ ngơi tại " + cleanName;
            }
        }

        // Default nếu không khớp category nào hoặc list rỗng
        return "Ghé thăm và tham quan " + cleanName;
    }

    private WeatherRequest buildWeatherRequest(WeatherRequestFE weatherRequest) {
        Province province = provinceRepository.findByProvinceName(weatherRequest.getProvince().name())
                .orElseThrow(() -> new RuntimeException("Province not found"));

        System.out.println(province.getId());
        System.out.println(province.getProvinceName());

        return WeatherRequest.builder()
                .provinceId(province.getId())
                .provinceName(province.getProvinceName())
                .startDate(weatherRequest.getStartDate())
                .endDate(weatherRequest.getEndDate())
                .fromOperateTime(weatherRequest.getFromOperateTime())
                .toOperateTime(weatherRequest.getToOperateTime())
                .build();
    }
}
