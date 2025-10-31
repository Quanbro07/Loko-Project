package com.exproject.backend.hobby;

import jakarta.persistence.*;

@Entity
@Table(name = "hobby")
public class Hobby {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hobby_name", nullable = false)
    private String hobbyName;

    public Hobby() {
    }

    public Hobby(String hobbyName) {
        this.hobbyName = hobbyName;
    }

    public Long getId() {
        return id;
    }

    public String getHobbyName() {
        return hobbyName;
    }

    public void setHobbyName(String hobbyName) {
        this.hobbyName = hobbyName;
    }
}
