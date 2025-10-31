package com.exproject.backend.trip;

import com.exproject.backend.user.info.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "trip")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "trip_name", nullable = false)
    private String tripName;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "num_adult")
    private Integer numAdult;

    @Column(name = "num_child")
    private Integer numChild;

    @Column(name = "num_elder")
    private Integer numElder;

    @Column(name = "status")
    private Integer status;

    @Column(name = "create_at")
    private LocalDateTime createAt;
}
