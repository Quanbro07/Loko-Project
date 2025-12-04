package com.exproject.backend.weather;

import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.trip_section.TripSection;
import com.exproject.backend.weather.dto.*;
import com.exproject.backend.weather.info.AlertWeather;
import com.exproject.backend.weather.info.HourlyWeather;
import com.exproject.backend.weather.info.WeatherSection;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class WeatherMapper {
    public WeatherResponse toWeatherResponse(Trip trip, List<WeatherSection> weatherSections) {
        WeatherResponse weatherResponse = new WeatherResponse();

        List<WeatherSectionResponse> weatherSectionResponses = weatherSections.stream()
                .map(this::toWeatherSectionResponse)
                .toList();

        List<AlertWeatherResponse> alertWeatherResponses = trip.getAlertWeathers().stream()
                .map(this::toAlertWeatherResponse)
                .toList();

        weatherResponse.setWeatherSections(weatherSectionResponses);
        weatherResponse.setAlerts(alertWeatherResponses);

        return weatherResponse;
    }

    private AlertWeatherResponse toAlertWeatherResponse(AlertWeather alertWeather) {
       AlertWeatherResponse alertWeatherResponse = new AlertWeatherResponse();

       alertWeatherResponse.setHeadline(alertWeather.getHeadline());
       alertWeatherResponse.setSeverity(alertWeather.getSeverity());
       alertWeatherResponse.setAreas(alertWeather.getAreas());
       alertWeatherResponse.setDescription(alertWeather.getDescription());

       return alertWeatherResponse;
    }

    private WeatherSectionResponse toWeatherSectionResponse(WeatherSection weatherSection) {
        WeatherSectionResponse weatherSectionResponse = new WeatherSectionResponse();

        weatherSectionResponse.setDayNum(weatherSection.getDayNumber());
        weatherSectionResponse.setDate(weatherSection.getDate());

        List<HourlyWeatherResponse> hourlyWeatherResponses = weatherSection.getHourlyWeatherList().stream()
                .map(this::toHourlyWeatherResponse)
                .toList();

        weatherSectionResponse.setHourlyWeathers(hourlyWeatherResponses);
        return weatherSectionResponse;
    }

    private HourlyWeatherResponse toHourlyWeatherResponse(HourlyWeather hourlyWeather) {
        HourlyWeatherResponse hourlyWeatherResponse = new HourlyWeatherResponse();
        ConditionWeatherResponse condition = new ConditionWeatherResponse();

        condition.setText(hourlyWeather.getText());
        condition.setIconURL(hourlyWeather.getIcon());

        hourlyWeatherResponse.setCondition(condition);
        hourlyWeatherResponse.setTempC(hourlyWeather.getTemperatureC());
        hourlyWeatherResponse.setTime(hourlyWeather.getDateTime());

        return hourlyWeatherResponse;
    }

}
