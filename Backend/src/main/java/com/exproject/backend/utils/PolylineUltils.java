package com.exproject.backend.utils;

import java.util.ArrayList;
import java.util.List;

public class PolylineUltils {
    // 1. Convert từ String Polyline -> List các toạ độ [Lat, Lng]
    // Dùng để trả về cho Frontend hoặc Python
    public static List<List<Double>> decode(String encodedPath) {
        List<List<Double>> poly = new ArrayList<>();
        int index = 0, len = encodedPath.length();
        int lat = 0, lng = 0;

        while (index < len) {
            int b, shift = 0, result = 0;
            do {
                b = encodedPath.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encodedPath.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            List<Double> p = new ArrayList<>();
            p.add((double) lat / 1E5); // Latitude
            p.add((double) lng / 1E5); // Longitude
            poly.add(p);
        }

        return poly;
    }

    // 2. Convert từ List toạ độ -> String Polyline
    // Dùng khi Python trả về List toạ độ, bạn muốn nén lại để lưu vào DB
    public static String encode(List<List<Double>> points) {
        StringBuilder result = new StringBuilder();
        long lastLat = 0;
        long lastLng = 0;

        for (List<Double> point : points) {
            long lat = Math.round(point.get(0) * 1E5);
            long lng = Math.round(point.get(1) * 1E5);

            long dLat = lat - lastLat;
            long dLng = lng - lastLng;

            encodeValue(dLat, result);
            encodeValue(dLng, result);

            lastLat = lat;
            lastLng = lng;
        }
        return result.toString();
    }

    private static void encodeValue(long value, StringBuilder result) {
        value = value < 0 ? ~(value << 1) : value << 1;
        while (value >= 0x20) {
            result.append(Character.toChars((int) ((0x20 | (value & 0x1f)) + 63)));
            value >>= 5;
        }
        result.append(Character.toChars((int) (value + 63)));
    }
}
