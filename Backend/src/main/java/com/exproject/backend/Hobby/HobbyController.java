package com.exproject.backend.hobby;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hobbies")
public class HobbyController {

    private final HobbyRepository hobbyRepository;

    public HobbyController(HobbyRepository hobbyRepository) {
        this.hobbyRepository = hobbyRepository;
    }

    @PostMapping
    public Hobby create(@RequestBody Hobby hobby) {
        return hobbyRepository.save(hobby);
    }

    @GetMapping
    public List<Hobby> getAll() {
        return hobbyRepository.findAll();
    }
}
