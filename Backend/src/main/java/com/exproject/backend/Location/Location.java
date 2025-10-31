package com.exproject.backend.location;

import com.exproject.backend.province.Province;
import jakarta.persistence.*;

@Entity
@Table(name = "location")
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK tới province
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "province_id", nullable = false)
    private Province province;

    @Column(name = "location_name", nullable = false)
    private String locationName;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(name = "open_time")
    private String openTime;

    @Column(name = "avg_visit_time")
    private String avgVisitTime;

    @Column(name = "ticket_price")
    private Double ticketPrice;

    @Column(name = "gg_place_id")
    private String ggPlaceId;

    public Location() {
    }

    public Long getId() {
        return id;
    }

    public Province getProvince() {
        return province;
    }

    public void setProvince(Province province) {
        this.province = province;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getOpenTime() {
        return openTime;
    }

    public void setOpenTime(String openTime) {
        this.openTime = openTime;
    }

    public String getAvgVisitTime() {
        return avgVisitTime;
    }

    public void setAvgVisitTime(String avgVisitTime) {
        this.avgVisitTime = avgVisitTime;
    }

    public Double getTicketPrice() {
        return ticketPrice;
    }

    public void setTicketPrice(Double ticketPrice) {
        this.ticketPrice = ticketPrice;
    }

    public String getGgPlaceId() {
        return ggPlaceId;
    }

    public void setGgPlaceId(String ggPlaceId) {
        this.ggPlaceId = ggPlaceId;
    }
}
