package com.exproject.backend.hobby.info;

import com.exproject.backend.location_category.info.ELocationCategory;

import java.util.*;

public class HobbyCategoryMapping {

    private static final Map<EHobby, List<ELocationCategory>> MAPPING = new HashMap<>();

    static {
        MAPPING.put(EHobby.CUISINE, List.of(
                ELocationCategory.SNACK,
                ELocationCategory.RESTAURANT,
                ELocationCategory.HOTEL,
                ELocationCategory.CAFE,
                ELocationCategory.NIGHT_MARKET,
                ELocationCategory.MARKET,
                ELocationCategory.SPECIALITY
        ));

        MAPPING.put(EHobby.ADVENTURE, List.of(
                ELocationCategory.HOTEL,
                ELocationCategory.MOUNTAIN,
                ELocationCategory.RESTAURANT,
                ELocationCategory.CAVE,
                ELocationCategory.CAMPING,
                ELocationCategory.WATERFALL,
                ELocationCategory.DIVING
        ));

        MAPPING.put(EHobby.RELAXATION, List.of(
                ELocationCategory.CAFE,
                ELocationCategory.HOTEL,
                ELocationCategory.RESORT,
                ELocationCategory.RESTAURANT,
                ELocationCategory.SPA,
                ELocationCategory.HOMESTAY,
                ELocationCategory.FLOWER_FIELD_GARDEN
        ));

        MAPPING.put(EHobby.NIGHTLIFE, List.of(
                ELocationCategory.NIGHT_MARKET,
                ELocationCategory.RESTAURANT,
                ELocationCategory.HOTEL,
                ELocationCategory.CAFE,
                ELocationCategory.BAR,
                ELocationCategory.WALKING_STREET
        ));

        MAPPING.put(EHobby.HISTORYCULTURE, List.of(
                ELocationCategory.CULTURE_PERFORMANCE,
                ELocationCategory.FESTIVAL,
                ELocationCategory.MUSEUM,
                ELocationCategory.RESTAURANT,
                ELocationCategory.HOTEL,
                ELocationCategory.CITADEL_PALACE,
                ELocationCategory.CHURCH_TEMPLE_PAGODA,
                ELocationCategory.OLD_BATTLEFIELD
        ));

        MAPPING.put(EHobby.HONEYMOON, List.of(
                ELocationCategory.HOTEL,
                ELocationCategory.RESORT,
                ELocationCategory.CAFE,
                ELocationCategory.RESTAURANT,
                ELocationCategory.BEACH,
                ELocationCategory.ISLAND,
                ELocationCategory.YATCH_CRUISE,
                ELocationCategory.VIEWPOINT
        ));

        MAPPING.put(EHobby.BEACHISLANDTOUR, List.of(
                ELocationCategory.BEACH,
                ELocationCategory.ISLAND,
                ELocationCategory.YATCH_CRUISE,
                ELocationCategory.HOTEL,
                ELocationCategory.RESORT,
                ELocationCategory.AMUSEMENT_WATER_PARK,
                ELocationCategory.RESTAURANT,
                ELocationCategory.MARKET,
                ELocationCategory.DIVING,
                ELocationCategory.VIEWPOINT
        ));

        MAPPING.put(EHobby.PHOTOGRAPHY, List.of(
                ELocationCategory.CAFE,
                ELocationCategory.HOTEL,
                ELocationCategory.CULTURE_PERFORMANCE,
                ELocationCategory.FESTIVAL,
                ELocationCategory.VIEWPOINT,
                ELocationCategory.FLOWER_FIELD_GARDEN,
                ELocationCategory.RESTAURANT,
                ELocationCategory.RIVER,
                ELocationCategory.WATERFALL
        ));

        MAPPING.put(EHobby.ENTERTAINMENT, List.of(
                ELocationCategory.AMUSEMENT_WATER_PARK,
                ELocationCategory.ZOO,
                ELocationCategory.FESTIVAL,
                ELocationCategory.CULTURE_PERFORMANCE,
                ELocationCategory.RESTAURANT,
                ELocationCategory.HOTEL,
                ELocationCategory.AQUARIUM,
                ELocationCategory.WALKING_STREET
        ));
    }

    public static List<ELocationCategory> getCategories(EHobby hobby) {
        return MAPPING.getOrDefault(hobby, Collections.emptyList());
    }
}
