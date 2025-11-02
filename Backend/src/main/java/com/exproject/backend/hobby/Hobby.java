package com.exproject.backend.hobby;

import com.exproject.backend.user.info.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "hobby")
public class Hobby {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hobby_name", nullable = false)
    private String hobbyName;

    @ManyToMany(mappedBy = "hobbies")
    private Set<User> users = new HashSet<>();
}
