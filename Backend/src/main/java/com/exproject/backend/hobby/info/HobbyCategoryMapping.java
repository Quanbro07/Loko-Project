package com.exproject.backend.hobby.info;

import com.exproject.backend.location_category.info.ELocationCategory;

import java.util.*;

public class HobbyCategoryMapping {

    private static final Map<EHobby, List<ELocationCategory>> MAPPING = new HashMap<>();

    static {
        MAPPING.put(EHobby.CUISINE, Arrays.asList(
                ELocationCategory.SNACK,
                ELocationCategory.RESTAURANT,
                ELocationCategory.CAFE,
                ELocationCategory.NIGHT_MARKET,
                ELocationCategory.MARKET,
                ELocationCategory.SPECIALITY
        ));

        MAPPING.put(EHobby.ADVENTURE, Arrays.asList(
                ELocationCategory.AMUSEMENT_WATER_PARK,
                ELocationCategory.ZOO,
                ELocationCategory.AQUARIUM,
                ELocationCategory.MARKET
        ));

        MAPPING.put(EHobby.RELAXATION, Arrays.asList(
                ELocationCategory.CAFE,
                ELocationCategory.HOTEL,
                ELocationCategory.SPECIALITY
        ));

        MAPPING.put(EHobby.NIGHTLIFE, Arrays.asList(
                ELocationCategory.NIGHT_MARKET,
                ELocationCategory.RESTAURANT,
                ELocationCategory.CAFE
        ));

        MAPPING.put(EHobby.HISTORYCULTURE, Arrays.asList(
                ELocationCategory.CULTURE_PERFORMANCE,
                ELocationCategory.FESTIVAL,
                ELocationCategory.MARKET
        ));

        MAPPING.put(EHobby.HONEYMOON, Arrays.asList(
                ELocationCategory.HOTEL,
                ELocationCategory.CAFE,
                ELocationCategory.RESTAURANT,
                ELocationCategory.SPECIALITY
        ));

        MAPPING.put(EHobby.BEACHISLANDTOUR, Arrays.asList(
                ELocationCategory.HOTEL,
                ELocationCategory.AMUSEMENT_WATER_PARK,
                ELocationCategory.MARKET
        ));

        MAPPING.put(EHobby.PHOTOGRAPHY, Arrays.asList(
                ELocationCategory.CAFE,
                ELocationCategory.MARKET,
                ELocationCategory.SPECIALITY,
                ELocationCategory.CULTURE_PERFORMANCE,
                ELocationCategory.FESTIVAL
        ));

        MAPPING.put(EHobby.ENTERTAINMENT, Arrays.asList(
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
