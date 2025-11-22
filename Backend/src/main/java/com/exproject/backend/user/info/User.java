package com.exproject.backend.user.info;

import com.exproject.backend.hobby.info.Hobby;
import com.exproject.backend.province.info.Province;
import com.exproject.backend.review_location.ReviewLocation;
import com.exproject.backend.trip.info.Trip;
import com.exproject.backend.trip_history.TripHistory;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "user_table")
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    private String email;

    private String password;

    private Integer age;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    private Role role;

    private Boolean enabled;

    @Column(name = "verification_code")
    private String verificationCode;

    @Column(name = "verification_expiration")
    private LocalDateTime verificationExpireAt;

    @Column(name = "reset_password_token")
    private String resetPasswordToken;

    @Column(name = "reset_password_expiration")
    private LocalDateTime resetPasswordExpiryAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JsonManagedReference
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @JoinTable(
            name = "user_hobby",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "hobby_id")
    )
    private Set<Hobby> hobbies = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @JoinTable(
            name = "visited_province",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "province_id")
    )
    private Set<Province> visitedProvinces = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<TripHistory> tripHistories = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Trip> trips = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<ReviewLocation> reviewLocations = new ArrayList<>();

    @Override
    public String getUsername() {
        return this.email;
    }

    public String getDisplayUserName() {
        return this.username;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return this.enabled;
    }

    // Help Function
    public void addTripHistory(TripHistory tripHistory) {
        this.tripHistories.add(tripHistory);
        tripHistory.setUser(this);
    }

    public void addHobbies(List<Hobby> hobbies) {
        for(Hobby hobby : hobbies) {
            this.hobbies.add(hobby);
            hobby.getUsers().add(this);
        }
    }

    public void addVisitedProvince(Province province) {
        this.visitedProvinces.add(province);
        province.getVisitedUsers().add(this);
    }

    public void addReviewLocation(ReviewLocation reviewLocation) {
        this.reviewLocations.add(reviewLocation);

        reviewLocation.setUser(this);
    }
}
