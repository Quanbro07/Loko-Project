package com.exproject.backend.location_img;

import com.exproject.backend.aiAPI.dto.RawLocationImgDTO;
import com.exproject.backend.location.Location;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationImgService {

    public List<LocationImg> createLocationImgs(List<RawLocationImgDTO> rawLocationImgs
    ,Location location) {
        if (rawLocationImgs == null) {
            return new ArrayList<>();
        }

        List<LocationImg> locationImgs = new ArrayList<>();

        for (RawLocationImgDTO rawLocationImg : rawLocationImgs) {
            LocationImg locationImg = LocationImg.builder()
                    .imgUrl(rawLocationImg.getImgUrl())
                    .description(rawLocationImg.getDescrption())
                    .build();

            // Tạo mối quan hệ 2 chiều
            location.addLocationImg(locationImg);

            locationImgs.add(locationImg);
        }
        return locationImgs;
    }
}
