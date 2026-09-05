package com.certifyhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class CertifyHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(CertifyHubApplication.class, args);
        System.out.println("\n" + "=".repeat(60));
        System.out.println("🚀 CertifyHub Digital Credential Platform is LIVE!");
        System.out.println("👉 Open the Portal: http://localhost:8080");
        System.out.println("👉 H2 Database:     http://localhost:8080/h2-console");
        System.out.println("=".repeat(60) + "\n");
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**").allowedOrigins("*");
            }
        };
    }
}
