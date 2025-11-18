package com.exproject.backend.hobby.info;

import com.exproject.backend.user.info.User;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
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
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Set<User> users = new HashSet<>();

    public Hobby(EHobby eHobby) {
        this.hobbyName = eHobby.name();
    }
}
