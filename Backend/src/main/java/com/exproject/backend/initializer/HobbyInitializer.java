package com.exproject.backend.initializer;

import com.exproject.backend.hobby.HobbyRepository;
import com.exproject.backend.hobby.info.EHobby;
import com.exproject.backend.hobby.info.Hobby;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Order(1)
public class HobbyInitializer implements CommandLineRunner {

    private final HobbyRepository hobbyRepository;

    @Override
    public void run(String... args) throws Exception {
        if(hobbyRepository.count() > 0) {
            return;
        }

        for(EHobby eHobby : EHobby.values()){
            Hobby hobby = new Hobby(eHobby);

            hobbyRepository.save(hobby);
        }
    }
}
