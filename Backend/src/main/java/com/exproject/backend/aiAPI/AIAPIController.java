package com.exproject.backend.aiAPI;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/v1/ai-api")
@RequiredArgsConstructor
public class AIAPIController {

    private final PythonAPIConfig pythonAPIConfig;

    private final AIAPIService aiAPIService;

    @GetMapping("/test")
    public String test() {
        return pythonAPIConfig.getBaseUrl() + pythonAPIConfig.getGetLocationUrl()
                + pythonAPIConfig.getMakePlanUrl();
    }



}
