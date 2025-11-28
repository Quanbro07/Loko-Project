package com.exproject.backend.aiAPI;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "python.api")
public class PythonAPIConfig {

    private String baseUrl;

    private String versionUrl;

    private String getLocationUrl;

    private String makePlanUrl;

    private String regeneratePlanUrl;
}
