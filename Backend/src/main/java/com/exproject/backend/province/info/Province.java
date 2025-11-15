package com.exproject.backend.province.info;

import com.exproject.backend.location.Location;
import com.exproject.backend.user.info.User;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    @ManyToMany(mappedBy = "visitedProvinces")
    @JsonBackReference
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Set<User> visitedUsers = new HashSet<>();

    private String region;

    // Constructor đặc biet
    public Province(EProvince eprovince,String region) {
        this.provinceName = eprovince.name();
        this.region = region;
    }
}
