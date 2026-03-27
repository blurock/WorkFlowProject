package info.blurock.datamanager.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.google.cloud.storage.Storage;
import com.google.firebase.cloud.StorageClient;
import org.springframework.context.annotation.Bean;
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
                        .setStorageBucket("blurock-database.appspot.com")
                        .build();
                FirebaseApp.initializeApp(options);
                System.out.println("Firebase has been initialized");
            }
        } catch (IOException e) {
            System.err.println("Error initializing Firebase: " + e.getMessage());
        }
    }

    @Bean
    public Firestore getFirestore() {
        return FirestoreClient.getFirestore();
    }

    @Bean
    public Storage getStorage() {
        return StorageClient.getInstance().bucket().getStorage();
    }
}
