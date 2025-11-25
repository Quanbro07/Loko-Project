package com.exproject.backend.hobby.info;

import com.exproject.backend.location_category.info.ELocationCategory;

import java.util.*;

public class HobbyCategoryMapping {

    private static final Map<EHobby, List<ELocationCategory>> MAPPING = new HashMap<>();

    static {
        MAPPING.put(EHobby.CUISINE, List.of(
                ELocationCategory.SNACK,
                ELocationCategory.RESTAURANT,
                ELocationCategory.CAFE,
                ELocationCategory.NIGHT_MARKET,
                ELocationCategory.MARKET,
                ELocationCategory.SPECIALITY
        ));

        MAPPING.put(EHobby.ADVENTURE, List.of(
                ELocationCategory.AMUSEMENT_WATER_PARK,
                ELocationCategory.ZOO,
                ELocationCategory.AQUARIUM,
                ELocationCategory.MARKET
        ));

        MAPPING.put(EHobby.RELAXATION, List.of(
                ELocationCategory.CAFE,
                ELocationCategory.HOTEL,
                ELocationCategory.SPECIALITY
        ));

        MAPPING.put(EHobby.NIGHTLIFE, List.of(
                ELocationCategory.NIGHT_MARKET,
                ELocationCategory.RESTAURANT,
                ELocationCategory.CAFE
        ));

        MAPPING.put(EHobby.HISTORYCULTURE, List.of(
                ELocationCategory.CULTURE_PERFORMANCE,
                ELocationCategory.FESTIVAL,
                ELocationCategory.MARKET
        ));

        MAPPING.put(EHobby.HONEYMOON, List.of(
                ELocationCategory.HOTEL,
                ELocationCategory.CAFE,
                ELocationCategory.RESTAURANT,
                ELocationCategory.SPECIALITY
        ));

        MAPPING.put(EHobby.BEACHISLANDTOUR, List.of(
                ELocationCategory.HOTEL,
                ELocationCategory.AMUSEMENT_WATER_PARK,
                ELocationCategory.MARKET
        ));

        MAPPING.put(EHobby.PHOTOGRAPHY, List.of(
                ELocationCategory.CAFE,
                ELocationCategory.MARKET,
                ELocationCategory.SPECIALITY,
                ELocationCategory.CULTURE_PERFORMANCE,
                ELocationCategory.FESTIVAL
        ));

        MAPPING.put(EHobby.ENTERTAINMENT, List.of(
                ELocationCategory.AMUSEMENT_WATER_PARK,
                ELocationCategory.FESTIVAL,
                ELocationCategory.CULTURE_PERFORMANCE,
                ELocationCategory.RESTAURANT
        ));
    }

    public static List<ELocationCategory> getCategories(EHobby hobby) {
        return MAPPING.getOrDefault(hobby, Collections.emptyList());
    }
}
