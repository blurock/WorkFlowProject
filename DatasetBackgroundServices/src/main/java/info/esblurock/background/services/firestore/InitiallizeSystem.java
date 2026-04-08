package info.esblurock.background.services.firestore;

import java.io.IOException;
import com.google.auth.oauth2.GoogleCredentials;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class InitiallizeSystem {
	private static final Logger logger = LoggerFactory.getLogger(InitiallizeSystem.class);
	static FirebaseOptions options = null;
	private static volatile boolean initialized = false; 

	public static void initialize() {
		intializeFirebase();
	}

	private static void intializeFirebase() {
		if (initialized) {
			return;
		}
		if (FirebaseApp.getApps().isEmpty()) {
			if (options == null) {
				try {
					String cloudRunService = System.getenv("K_SERVICE");
					boolean isProduction = cloudRunService != null;
					
					if (isProduction) {
						logger.info("Initializing Firebase for PRODUCTION (Cloud Run: {})", cloudRunService);
					} else {
						logger.info("Initializing Firebase for DEVELOPMENT (Local) — writing to cloud Firestore");
					}
					options = FirebaseOptions.builder()
							.setCredentials(GoogleCredentials.getApplicationDefault())
							.setProjectId("blurock-database")
							.setStorageBucket("blurock-database.appspot.com")
							.build();

					FirebaseApp.initializeApp(options);
					initialized = true;
					logger.info("Firebase initialization successful.");
				} catch (IOException e) {
					logger.error("Error initializing Firebase: {}", e.getMessage(), e);
				}
			}
		}
	}
}
