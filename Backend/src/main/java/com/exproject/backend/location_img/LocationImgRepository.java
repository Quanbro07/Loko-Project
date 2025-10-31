package com.exproject.backend.location_img;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationImgRepository extends JpaRepository<LocationImg, Long> {

    List<LocationImg> findByLocation_Id(Long locationId);
}
