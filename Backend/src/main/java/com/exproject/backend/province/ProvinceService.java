package com.exproject.backend.province;

import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.location.dto.LocationResponse;
import com.exproject.backend.province.dto.ProvinceDTO;
import com.exproject.backend.province.info.Province;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProvinceService {

    private final ProvinceRepository provinceRepository;


    public List<ProvinceDTO> getAllProvince(Long userId) {
        List<Province> visiedProvinces = provinceRepository.findAllByVisitedUsers_Id(userId);

        List<ProvinceDTO> provinceDTOs = visiedProvinces.stream()
                .map(this::convertToDTO)
                .toList();

        return provinceDTOs;
    }

    private ProvinceDTO convertToDTO(Province province) {
        return ProvinceDTO.builder()
                .provinceId(province.getId())
                .provinceName(province.getProvinceName())
                .build();
    }
}
