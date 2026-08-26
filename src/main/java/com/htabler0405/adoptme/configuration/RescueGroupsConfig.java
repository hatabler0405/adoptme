package com.htabler0405.adoptme.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

@Configuration
public class RescueGroupsConfig {

    @Value("${rescuegroups.api.key}")
    private String apiKey;

    @Value("${rescuegroups.api.base-url:https://api.rescuegroups.org/v5}")
    private String baseUrl;

    @Bean
    public RestClient rescueGroupsRestClient() {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}