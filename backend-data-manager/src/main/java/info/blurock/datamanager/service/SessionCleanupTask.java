package info.blurock.datamanager.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.concurrent.ExecutionException;

/**
 * Periodically prunes 'dead' sessions that haven't been active for 24 hours.
 * Multi-user safety: Finds sessions across the entire users/{uid}/sessions hierarchy.
 */
@Service
public class SessionCleanupTask {

    @Autowired
    private Firestore firestore;

    /**
     * Runs every 24 hours to clean up inactive sessions.
     * Fixed delay is used here for POC; in production, use a Cron expression.
     */
    @Scheduled(fixedDelay = 86400000) 
    public void cleanupOldSessions() {
        System.out.println("Starting scheduled session cleanup...");
        
        long threshold = System.currentTimeMillis() - (24 * 60 * 60 * 1000);
        Date cutoff = new Date(threshold);

        try {
            // Find all session documents where lastActivity is before the cutoff
            // Note: This also requires a Collection Group Index on 'sessions' for the 'lastActivity' field.
            Query oldSessions = firestore.collectionGroup("sessions")
                                         .whereLessThan("lastActivity", cutoff);

            ApiFuture<QuerySnapshot> querySnapshot = oldSessions.get();
            for (DocumentSnapshot doc : querySnapshot.get().getDocuments()) {
                deleteSessionRecursive(doc.getReference());
            }
            
            System.out.println("Session cleanup complete.");
        } catch (Exception e) {
            System.err.println("Error during session cleanup: " + e.getMessage());
        }
    }

    /**
     * Recursively delete a session and all its sub-collections.
     * Firestore doesn't automatically delete sub-collections when a parent is deleted.
     */
    private void deleteSessionRecursive(DocumentReference sessionRef) throws ExecutionException, InterruptedException {
        System.out.println("Deleting expired session: " + sessionRef.getPath());
        
        // 1. Delete all sub-collections (e.g., molecule-tasks, calculations)
        Iterable<CollectionReference> collections = sessionRef.listCollections();
        for (CollectionReference col : collections) {
            deleteCollection(col);
        }
        
        // 2. Delete the session document itself
        sessionRef.delete().get();
    }

    private void deleteCollection(CollectionReference collection) throws ExecutionException, InterruptedException {
        // Simple recursive deletion for POC; for large collections, use batching.
        ApiFuture<QuerySnapshot> future = collection.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot doc : documents) {
            doc.getReference().delete().get();
        }
    }
}
