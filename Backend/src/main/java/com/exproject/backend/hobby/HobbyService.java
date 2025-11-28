package com.exproject.backend.hobby;

import com.exproject.backend.hobby.dto.HobbyRequest;
import com.exproject.backend.hobby.info.Hobby;
import com.exproject.backend.user.UserRepository;
import com.exproject.backend.user.info.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HobbyService {

    private final HobbyRepository hobbyRepository;

    private final UserRepository userRepository;

    public void updateUserHobby(HobbyRequest hobbyRequest) {
        User user = userRepository.findById(hobbyRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Hobby> hobbies = hobbyRepository.findAllByHobbyNameIn(hobbyRequest.getHobbies());

        user.addHobbies(hobbies);

        userRepository.save(user);
    }
}
