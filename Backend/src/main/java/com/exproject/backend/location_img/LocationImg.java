package com.exproject.backend.location_img;

import com.exproject.backend.location.Location;
import com.exproject.backend.location_img.dto.LocationImgDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "location_img")
public class LocationImg {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(name = "img_url", nullable = false)
    private String imgUrl;

    private String description;

    public LocationImg(LocationImgDTO imgDTO) {
        this.imgUrl = imgDTO.getImg_url();
        this.description = imgDTO.getDescription();
    }
}
