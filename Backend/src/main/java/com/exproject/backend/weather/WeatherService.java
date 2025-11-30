package com.exproject.backend.weather;

import com.exproject.backend.aiAPI.AIAPIService;
import com.exproject.backend.weather.dto.WeatherRequest;
import com.exproject.backend.weather.dto.WeatherResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class WeatherService {

    private final AIAPIService aiAPIService;

    public WeatherResponse getWeather(WeatherRequest request) {
        WeatherResponse response = aiAPIService.forecastWeather(request);

        return response;
    }

}
