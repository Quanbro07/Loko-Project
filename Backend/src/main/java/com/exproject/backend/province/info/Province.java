package com.exproject.backend.province.info;

import com.exproject.backend.location.Location;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "province")
public class Province {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "province_name", nullable = false)
    private String provinceName;

    @OneToMany(mappedBy = "province",cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Location> locations;

    private String region;

    // Constructor đặc biet
    public Province(EProvince eprovince,String region) {
        this.provinceName = eprovince.name();
        this.region = region;
    }
}
