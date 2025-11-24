package com.exproject.backend.wrapper;

import com.exproject.backend.location.dto.LocationDTO;

public class CandidateScore {
    LocationDTO location;
    double totalDistanceScore;

    public CandidateScore(LocationDTO location, double score) {
        this.location = location;
        this.totalDistanceScore = score;
    }

    public double getScore() { return totalDistanceScore; }
    public LocationDTO getLocation() { return location; }
}
