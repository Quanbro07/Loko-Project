package com.exproject.backend.weather;

import com.exproject.backend.aiAPI.AIAPIService;
import com.exproject.backend.province.ProvinceRepository;
import com.exproject.backend.province.info.Province;
import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.trip_section.TripSection;
import com.exproject.backend.trip_section.TripSectionRepository;
import com.exproject.backend.weather.dto.*;
import com.exproject.backend.weather.info.AlertWeather;
import com.exproject.backend.weather.info.HourlyWeather;
import com.exproject.backend.weather.info.WeatherSection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@RequiredArgsConstructor
@Service
public class WeatherService {

    private final AIAPIService aiAPIService;

    private final TripSectionRepository tripSectionRepository;

    public void createWeatherSection(Trip trip, WeatherResponse response, List<TripSection> sectionsToUpdate) {
        List<WeatherSectionResponse> sectionResponses = response.getWeatherSections();

        Integer startDayNumber = sectionsToUpdate.get(0).getDayNumber();


        // Check empty
        if(sectionResponses.isEmpty()) {
            throw new RuntimeException("There are no responses to create a weather section");
        }


        // Check phải cùng size
        if(sectionResponses.size() != sectionsToUpdate.size()) {
            throw new RuntimeException("There are different size between sections in the response");
        }

        // Lấy Alert
        List<AlertWeatherResponse> alertResponses = response.getAlerts();

        // Nếu có alert
        // Tạo Alert
        if(!alertResponses.isEmpty()) {
            createAlertWeather(trip,alertResponses);
        }

        for(int i = 0; i < sectionResponses.size(); i++) {
            TripSection section = sectionsToUpdate.get(i);
            WeatherSectionResponse sectionResponse = sectionResponses.get(i);

            // Tạo Weather Section
            WeatherSection newWeatherSection = new WeatherSection(sectionResponse,startDayNumber);

            for(HourlyWeatherResponse hourlyWeatherResponse: sectionResponse.getHourlyWeathers()) {

                // Tạo Hourly Wether
                HourlyWeather newHourlyWeather = new HourlyWeather(hourlyWeatherResponse);

                // Gắn mối quan hệ 2 chiều
                newWeatherSection.addHourlyWeather(newHourlyWeather);
            }

            section.addWeatherSection(newWeatherSection);

        }
        tripSectionRepository.saveAll(sectionsToUpdate);
        System.out.println("Created  weather sections");
    }

    private void createAlertWeather(Trip trip, List<AlertWeatherResponse> alertResponses) {
        for(AlertWeatherResponse alertWeatherResponse: alertResponses) {
            // Tạo Alert Weather
            AlertWeather newAlertWeather = new AlertWeather(alertWeatherResponse);

            // Gắn mối quan hệ 2 chiều
            trip.addAlertWeather(newAlertWeather);
        }
    }

    public WeatherResponse getWeather(WeatherRequest request) {
        WeatherResponse response = aiAPIService.forecastWeather(request);

        return response;
    }

    // Helper Function
    public boolean shouldFetchNewWeather(WeatherSection weather) {
        if (weather == null) {
            return true;
        }

        return false;
    }

    public WeatherRequest buildWeatherRequest(Trip trip, Province province, LocalDate startDate, LocalDate endDate) {
        System.out.println(province.getId());
        System.out.println(province.getProvinceName());
        return WeatherRequest.builder()
                .provinceId(province.getId())
                .provinceName(province.getProvinceName())
                .startDate(startDate)
                .endDate(endDate)
                .fromOperateTime(trip.getFromOperationTime())
                .toOperateTime(trip.getToOperationTime())
                .build();
    }


}
