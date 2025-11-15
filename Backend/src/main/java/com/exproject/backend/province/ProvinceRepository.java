package com.exproject.backend.province;

import com.exproject.backend.location.Location;
import com.exproject.backend.province.info.Province;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProvinceRepository extends JpaRepository<Province, Long> {
    Optional<Province> findByProvinceName(String provinceName);
}
