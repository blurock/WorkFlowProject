package info.esblurock.background.services;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
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
}
