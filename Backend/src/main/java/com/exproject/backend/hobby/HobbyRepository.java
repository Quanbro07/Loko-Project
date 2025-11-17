package com.exproject.backend.hobby;

import com.exproject.backend.hobby.info.Hobby;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HobbyRepository extends JpaRepository<Hobby, Long> {
    List<Hobby> findAllByHobbyNameIn(List<String> hobbyNames);
}
