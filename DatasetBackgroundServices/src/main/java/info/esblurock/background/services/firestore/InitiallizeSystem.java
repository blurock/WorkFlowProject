package info.esblurock.background.services.firestore;

import java.io.IOException;

import com.google.appengine.api.utils.SystemProperty;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

public class InitiallizeSystem {

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
				if (SystemProperty.environment.value() == SystemProperty.Environment.Value.Production) {
					options = FirebaseOptions.builder().setCredentials(GoogleCredentials.getApplicationDefault())
							.setStorageBucket("blurock-database.appspot.com").build();
				} else {
					FirestoreOptions firestoreOptions = FirestoreOptions.getDefaultInstance().toBuilder()
							.setProjectId("blurock-database").setCredentials(GoogleCredentials.getApplicationDefault())
							.setHost("localhost:8081") // Firestore emulator host
							.build();

					// FileInputStream serviceAccount =
					// new FileInputStream("path/to/serviceAccountKey.json");
					

					options = new FirebaseOptions.Builder().setFirestoreOptions(firestoreOptions)
							.setCredentials(GoogleCredentials.getApplicationDefault())
							.setProjectId("blurock-database")
							// .setStorageBucket("blurock-database.appspot.com")
							.setStorageBucket("localhost:9199").build();
				}

				FirebaseApp.initializeApp(options);
				initialized = true;
			} catch (IOException e) {
				e.printStackTrace();
			}
		} else {
		}
	} else {
	}
	}
}
