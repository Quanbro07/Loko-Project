package com.exproject.backend.route;

import com.exproject.backend.aiAPI.AIAPIService;
import com.exproject.backend.route.dto.RouteRequest;
import com.exproject.backend.route.dto.RouteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@RequiredArgsConstructor
@Service
public class RouteService {

    private final AIAPIService aiAPIService;

    public RouteResponse getRoute(RouteRequest routeRequest) {

        RouteResponse routeResponse = aiAPIService.generateRoutePlan(routeRequest);

        return routeResponse;
    }
}
