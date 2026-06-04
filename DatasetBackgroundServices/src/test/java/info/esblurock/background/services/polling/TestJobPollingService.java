package info.esblurock.background.services.polling;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;
import java.util.UUID;
import com.google.gson.JsonObject;
import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.firestore.polling.JobPollingService;

public class TestJobPollingService {

    @Test
    public void testJobPollingLifecycle() {
        // Initialize Firebase context
        InitiallizeSystem.initialize();

        String testUid = "junit-test-user";
        String testSessionId = "session-" + UUID.randomUUID().toString();

        System.out.println("Starting test with SessionId: " + testSessionId);

        // 1. Test Initialize
        JobPollingService.initialize(testUid, testSessionId);
        JsonObject initStatus = JobPollingService.readStatus(testUid, testSessionId);
        
        assertNotNull(initStatus);
        assertTrue(initStatus.has("status"));
        assertEquals("Initialized", initStatus.get("status").getAsString());
        assertEquals(0, initStatus.get("progress").getAsInt());
        assertEquals("Starting job...", initStatus.get("message").getAsString());

        // 2. Test Update Status
        JobPollingService.updateStatus(testUid, testSessionId, "In Progress Step 1", 45, "Processing rules...");
        JsonObject updateStatus = JobPollingService.readStatus(testUid, testSessionId);
        
        assertNotNull(updateStatus);
        assertEquals("In Progress Step 1", updateStatus.get("status").getAsString());
        assertEquals(45, updateStatus.get("progress").getAsInt());
        assertEquals("Processing rules...", updateStatus.get("message").getAsString());

        // 3. Test Success completion
        JobPollingService.recordSuccess(testUid, testSessionId, "Calculations finished!");
        JsonObject successStatus = JobPollingService.readStatus(testUid, testSessionId);
        
        assertNotNull(successStatus);
        assertEquals("Complete", successStatus.get("status").getAsString());
        assertEquals(100, successStatus.get("progress").getAsInt());
        assertEquals("Calculations finished!", successStatus.get("message").getAsString());

        // 4. Test Failure recording
        JobPollingService.recordFailure(testUid, testSessionId, "OutOfMemoryError in calculation");
        JsonObject failStatus = JobPollingService.readStatus(testUid, testSessionId);
        
        assertNotNull(failStatus);
        assertEquals("Failed", failStatus.get("status").getAsString());
        assertEquals(-1, failStatus.get("progress").getAsInt());
        assertEquals("OutOfMemoryError in calculation", failStatus.get("error").getAsString());
    }
}
