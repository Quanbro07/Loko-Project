package com.exproject.backend.province;

import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.location.dto.LocationResponse;
import com.exproject.backend.province.dto.ProvinceDTO;
import com.exproject.backend.province.dto.VisitedProvinceResponse;
import com.exproject.backend.province.info.Province;
import com.exproject.backend.user.UserRepository;
import com.exproject.backend.user.info.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProvinceService {

    private final ProvinceRepository provinceRepository;

    private final UserRepository userRepository;


    public VisitedProvinceResponse getAllProvince(Long userId) {

        Optional<User> user = userRepository.findById(userId);

        if(user.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        List<Province> visiedProvinces = provinceRepository.findAllByVisitedUsers_Id(userId);

        List<ProvinceDTO> provinceDTOs = visiedProvinces.stream()
                .map(this::convertToDTO)
                .toList();

        VisitedProvinceResponse response = VisitedProvinceResponseBuilder(provinceDTOs);

        return response;
    }

    // Helper Function
    private VisitedProvinceResponse VisitedProvinceResponseBuilder(List<ProvinceDTO> provinceDTOs) {
        return VisitedProvinceResponse.builder()
                .totalVisited(provinceDTOs.size())
                .visitedProvinces(provinceDTOs)
                .build();
    }

    private ProvinceDTO convertToDTO(Province province) {
        return ProvinceDTO.builder()
                .provinceId(province.getId())
                .provinceName(province.getProvinceName())
                .build();
    }
}
