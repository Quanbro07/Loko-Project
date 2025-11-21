package com.exproject.backend.hobby.info;

import java.util.List;
import java.util.Map;
import com.exproject.backend.location_category.info.ELocationCategory;

public class HobbyCategoryMapping {

    private static final Map<EHobby, List<ELocationCategory>> map = Map.of(

            EHobby.CUISINE, List.of(
                    ELocationCategory.RESTAURANT,
                    ELocationCategory.CAFE,
                    ELocationCategory.SNACK,
                    ELocationCategory.SPECIALITY,
                    ELocationCategory.NIGHT_MARKET
            ),

            EHobby.ADVENTURE, List.of(
                    ELocationCategory.AMUSEMENT,
                    ELocationCategory.WATER_PARK,
                    ELocationCategory.ZOO,
                    ELocationCategory.AQUARIUM,
                    ELocationCategory.MARKET
            ),

            EHobby.RELAXATION, List.of(
                    ELocationCategory.HOTEL,
                    ELocationCategory.CAFE,
                    ELocationCategory.SPECIALITY
            ),

            EHobby.ENTERTAINMENT, List.of(
                    ELocationCategory.AMUSEMENT,
                    ELocationCategory.WATER_PARK,
                    ELocationCategory.FESTIVAL,
                    ELocationCategory.CULTURE_PERFORMANCE,
                    ELocationCategory.RESTAURANT
            ),

            EHobby.PHOTOGRAPHY, List.of(
                    ELocationCategory.CAFE,
                    ELocationCategory.MARKET,
                    ELocationCategory.SPECIALITY,
                    ELocationCategory.CULTURE_PERFORMANCE,
                    ELocationCategory.FESTIVAL
            ),

            EHobby.HISTORYCULTURE, List.of(
                    ELocationCategory.CULTURE_PERFORMANCE,
                    ELocationCategory.FESTIVAL,
                    ELocationCategory.MARKET
            ),

            EHobby.HONEYMOON, List.of(
                    ELocationCategory.HOTEL,
                    ELocationCategory.CAFE,
                    ELocationCategory.RESTAURANT,
                    ELocationCategory.SPECIALITY
            ),

            EHobby.NIGHTLIFE, List.of(
                    ELocationCategory.NIGHT_MARKET,
                    ELocationCategory.RESTAURANT,
                    ELocationCategory.CAFE
            ),

            EHobby.BEACHISLANDTOUR, List.of(
                    ELocationCategory.HOTEL,
                    ELocationCategory.WATER_PARK,
                    ELocationCategory.AMUSEMENT,
                    ELocationCategory.MARKET
            )
    );

    public static List<ELocationCategory> getCategories(EHobby hobby) {
        return map.getOrDefault(hobby, List.of());
    }
}
