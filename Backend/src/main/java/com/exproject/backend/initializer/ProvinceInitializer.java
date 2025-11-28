package com.exproject.backend.initializer;

import com.exproject.backend.province.ProvinceRepository;
import com.exproject.backend.province.info.EProvince;
import com.exproject.backend.province.info.Province;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Order(1)
public class ProvinceInitializer implements CommandLineRunner {

    private final ProvinceRepository provinceRepository;

    @Override
    public void run(String... args) throws Exception {

        if(provinceRepository.count() > 0) {
            return;
        }

        int index = 0;
        for(EProvince Eprovince: EProvince.values()) {
            String region;

            // Bắc
            if(index >= 0 && index < 15) {
                region = "BAC";
            }
            else if(index >= 15 && index < 22) {
                region = "TRUNG";
            }
            else if(index >= 22 && index < 26) {
                region = "TAYNGUYEN";
            }
            else {
                region = "NAM";
            }

            index++;

            Province province = new Province(Eprovince, region);
            provinceRepository.save(province);
        }
    }
}
