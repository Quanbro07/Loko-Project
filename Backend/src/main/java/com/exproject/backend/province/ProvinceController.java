package com.exproject.backend.province;

import com.exproject.backend.location.dto.LocationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/province")
public class ProvinceController {

    private final ProvinceService provinceService;



}
