package info.esblurock.background.services;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.reaction.core.ontology.base.OntologyBase;
import jakarta.annotation.PostConstruct;

@SpringBootApplication
public class BackgroundServicesApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackgroundServicesApplication.class, args);
    }

    @PostConstruct
    public void init() {
        System.out.println("Initializing DatasetBackgroundServices...");
        // Initialize Firebase and System
        InitiallizeSystem.initialize();
        // Initialize Ontology
        OntologyBase.Util.getDatabaseOntology();
        System.out.println("Initialization complete.");
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("*") // In production, replace with specific frontend URL
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("Content-Type", "Authorization")
                        .maxAge(3600);
            }
        };
    }
}
