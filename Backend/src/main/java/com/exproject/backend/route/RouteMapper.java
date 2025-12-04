package com.exproject.backend.route;

import com.exproject.backend.route.dto.RoutePathResponse;
import com.exproject.backend.route.dto.RouteResponse;
import com.exproject.backend.route.dto.SectionRouteResponse;
import com.exproject.backend.trip_detail.TripDetail;
import com.exproject.backend.trip_section.TripSection;
import com.exproject.backend.utils.PolylineUltils;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class RouteMapper {
    // Tu Trip Section -> Route Response
    public RouteResponse toRouteResponse(List<TripSection> tripSections) {
        RouteResponse routeResponse = new RouteResponse();

        List<SectionRouteResponse> sectionRouteResponses = tripSections.stream()
                .map(this::toSectionRouteResponse)
                .toList();

        routeResponse.setSections(sectionRouteResponses);
        return routeResponse;
    }

    private SectionRouteResponse toSectionRouteResponse(TripSection tripSection) {
        SectionRouteResponse sectionRouteResponse = new SectionRouteResponse();
        sectionRouteResponse.setDayNumber(tripSection.getDayNumber());

        List<RoutePathResponse> routePathResponses = tripSection.getTripDetails().stream()
                .map(this::toRoutePathResponse)
                .toList();

        sectionRouteResponse.setRoutePath(routePathResponses);

        return sectionRouteResponse;
    }

    private RoutePathResponse toRoutePathResponse(TripDetail tripDetail) {
        RoutePathResponse routePathResponse = new RoutePathResponse();

        routePathResponse.setDistanceMeters(tripDetail.getDistance());
        routePathResponse.setDurationSeconds(tripDetail.getTime_second());

        List<List<Double>> path = PolylineUltils.decode(tripDetail.getRoutePolyline());

        routePathResponse.setPath(path);

        return routePathResponse;
    }
}
