package info.esblurock.reaction.core.firestore.polling;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.google.gson.JsonObject;
import info.esblurock.reaction.core.firestore.FirestoreBaseClass;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * JobPollingService provides static methods to track the progress,
 * intermediate status, and error states of background jobs in Firestore.
 * It stores updates at /workflows/{uid}/sessions/{sessionId}/pollStatus/progress.
 */
public class JobPollingService {
    private static final Logger LOGGER = Logger.getLogger(JobPollingService.class.getName());
    private static final String COLLECTION_WORKFLOWS = "workflows";
    private static final String COLLECTION_SESSIONS = "sessions";
    private static final String COLLECTION_POLL_STATUS = "pollStatus";
    private static final String DOCUMENT_PROGRESS = "progress";

    private static DocumentReference getDocumentReference(String uid, String sessionId) throws Exception {
        Firestore db = FirestoreBaseClass.getFirebaseDatabase();
        return db.collection(COLLECTION_WORKFLOWS)
                .document(uid)
                .collection(COLLECTION_SESSIONS)
                .document(sessionId)
                .collection(COLLECTION_POLL_STATUS)
                .document(DOCUMENT_PROGRESS);
    }

    /**
     * Initializes a job's progress status in Firestore.
     *
     * @param uid The authenticated user ID.
     * @param sessionId The active session ID.
     */
    public static void initialize(String uid, String sessionId) {
        updateStatus(uid, sessionId, "Initialized", 0, "Starting job...", null);
    }

    /**
     * Updates the status and progress percentage of a running job in Firestore.
     *
     * @param uid The authenticated user ID.
     * @param sessionId The active session ID.
     * @param status The current status label (e.g., "Calculating Benson Rules").
     * @param progress The progress percentage (0 to 100).
     * @param message A description of the current step.
     */
    public static void updateStatus(String uid, String sessionId, String status, int progress, String message) {
        updateStatus(uid, sessionId, status, progress, message, null);
    }

    /**
     * Updates the status, progress, message, and error details of a job in Firestore.
     *
     * @param uid The authenticated user ID.
     * @param sessionId The active session ID.
     * @param status The current status label.
     * @param progress The progress percentage.
     * @param message A description of the current step.
     * @param error The error message, or null if none.
     */
    public static void updateStatus(String uid, String sessionId, String status, int progress, String message, String error) {
        try {
            DocumentReference docRef = getDocumentReference(uid, sessionId);
            Map<String, Object> data = new HashMap<>();
            data.put("status", status);
            data.put("progress", progress);
            data.put("message", message);
            data.put("timestamp", Timestamp.now());
            data.put("error", error == null ? "" : error);

            ApiFuture<WriteResult> result = docRef.set(data);
            result.get(); // Block until the write is committed to Firestore
            // Non-blocking logger output
            LOGGER.log(Level.INFO, "JobPollingService: Updated status for session {0} - Status: {1}, Progress: {2}%",
                    new Object[]{sessionId, status, progress});
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "JobPollingService: Failed to update status for session: " + sessionId, e);
        }
    }

    /**
     * Records a successful completion of a job.
     *
     * @param uid The authenticated user ID.
     * @param sessionId The active session ID.
     * @param message The success message.
     */
    public static void recordSuccess(String uid, String sessionId, String message) {
        updateStatus(uid, sessionId, "Complete", 100, message, null);
    }

    /**
     * Records a failure of a job.
     *
     * @param uid The authenticated user ID.
     * @param sessionId The active session ID.
     * @param errorMessage The error message describing the failure.
     */
    public static void recordFailure(String uid, String sessionId, String errorMessage) {
        updateStatus(uid, sessionId, "Failed", -1, "Job failed with error", errorMessage);
    }

    /**
     * Reads the current progress document from Firestore.
     *
     * @param uid The authenticated user ID.
     * @param sessionId The active session ID.
     * @return A JsonObject containing status, progress, message, error, and timestamp.
     */
    public static JsonObject readStatus(String uid, String sessionId) {
        JsonObject response = new JsonObject();
        try {
            DocumentReference docRef = getDocumentReference(uid, sessionId);
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();
            if (document.exists()) {
                response.addProperty("status", document.getString("status"));
                response.addProperty("progress", document.getLong("progress"));
                response.addProperty("message", document.getString("message"));
                response.addProperty("error", document.getString("error"));
                if (document.getTimestamp("timestamp") != null) {
                    response.addProperty("timestamp", document.getTimestamp("timestamp").toString());
                }
            } else {
                response.addProperty("error", "No polling document found.");
            }
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "JobPollingService: Failed to read status for session: " + sessionId, e);
            response.addProperty("error", e.getMessage());
        }
        return response;
    }
}
