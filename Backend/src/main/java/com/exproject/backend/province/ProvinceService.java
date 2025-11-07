package com.exproject.backend.province;

import com.exproject.backend.location.LocationRepository;
import com.exproject.backend.location.dto.LocationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProvinceService {

    private final ProvinceRepository provinceRepository;



}
