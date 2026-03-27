package info.blurock.datamanager.service;

import com.google.cloud.firestore.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class MoleculeTaskListenerService {

    @Autowired
    private Firestore firestore;

    @PostConstruct
    public void startListening() {
        System.out.println("Starting Firestore Collection Group listener for molecule-tasks...");

        // Query for documents with status 'pending' across ALL collections named 'molecule-tasks'
        // Note: This requires a Collection Group Index in Firestore.
        Query tasks = firestore.collectionGroup("molecule-tasks");
        tasks.whereEqualTo("status", "pending")
             .addSnapshotListener((snapshots, e) -> {
                 if (e != null) {
                     System.err.println("Listen failed: " + e);
                     return;
                 }

                 if (snapshots != null && !snapshots.isEmpty()) {
                     for (DocumentSnapshot doc : snapshots.getDocuments()) {
                         // Double-check status and only process if still pending
                         if ("pending".equals(doc.getString("status"))) {
                             processTask(doc);
                         }
                     }
                 }
             });
    }

    private void processTask(DocumentSnapshot doc) {
        String docPath = doc.getReference().getPath();
        String smiles = doc.getString("smiles");
        String taskType = doc.getString("type");

        System.out.println("Processing task at path: " + docPath + " type: " + taskType + " SMILES: " + smiles);

        try {
            // 1. Move to 'processing' status to avoid duplicate handling
            doc.getReference().update("status", "processing");

            // 2. Perform dummy calculation (simulation)
            Thread.sleep(2000); 

            String result;
            if (smiles != null && !smiles.isEmpty()) {
                // A very scientific calculation: count the characters in the SMILES
                int atomCount = smiles.replaceAll("[^a-zA-Z]", "").length();
                result = "Calculated molecular weight (fake): " + (atomCount * 12.011) + " g/mol. " +
                         "Processing of " + smiles + " completed successfully at " + new java.util.Date();
            } else {
                result = "No SMILES provided. Validation completed at " + new java.util.Date();
            }

            // 3. Update document with result and status 'complete'
            Map<String, Object> updates = new HashMap<>();
            updates.put("status", "complete");
            updates.put("result", result);
            doc.getReference().update(updates);

            System.out.println("Task completed: " + docPath);

        } catch (Exception e) {
            System.err.println("Error processing task " + docPath + ": " + e.getMessage());
            doc.getReference().update("status", "error", "error", e.getMessage());
        }
    }
}
