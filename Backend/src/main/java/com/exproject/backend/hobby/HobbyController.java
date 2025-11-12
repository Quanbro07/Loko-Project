package com.exproject.backend.hobby;

import com.exproject.backend.hobby.dto.HobbyRequest;
import com.exproject.backend.hobby.info.Hobby;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/hobby")
public class HobbyController {

    private final HobbyService hobbyService;

    @PostMapping("/update")
    public String updateHobby(@RequestBody HobbyRequest hobbyRequest) {
        hobbyService.updateUserHobby(hobbyRequest);

        return "Success";
    }
}
