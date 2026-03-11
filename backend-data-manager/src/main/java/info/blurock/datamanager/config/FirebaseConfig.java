package info.blurock.datamanager.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.getApplicationDefault())
                        .setProjectId("blurock-database")
                        .build();
                FirebaseApp.initializeApp(options);
                System.out.println("Firebase has been initialized");
            }
        } catch (IOException e) {
            System.err.println("Error initializing Firebase: " + e.getMessage());
        }
    }
}
