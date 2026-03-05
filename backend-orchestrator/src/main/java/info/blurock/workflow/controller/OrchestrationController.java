package info.blurock.workflow.controller;

import com.google.cloud.workflows.executions.v1.CreateExecutionRequest;
import com.google.cloud.workflows.executions.v1.Execution;
import com.google.cloud.workflows.executions.v1.ExecutionsClient;
import com.google.cloud.workflows.executions.v1.WorkflowName;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import java.util.Collections;

@RestController
@RequestMapping("/api/orchestration")
public class OrchestrationController {

    private final String projectId = "blurock-database";
    private final String location = "europe-west1"; // us-central1
    private final String workflowName = "chat-workflow"; // The name we will give the YAML deployed to GCP

    @PostMapping("/start")
    public ResponseEntity<Map<String, String>> startWorkflow(@RequestBody Map<String, String> request) {
        String prompt = request.get("prompt");

        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try (ExecutionsClient executionsClient = ExecutionsClient.create()) {
            WorkflowName workflow = WorkflowName.of(projectId, location, workflowName);

            // Create the JSON arguments to pass into the Google Workflow
            Map<String, Object> workflowArgs = new HashMap<>();
            workflowArgs.put("prompt", prompt);
            workflowArgs.put("environment", "dev"); // Inform the workflow to use the dev Firestore collections

            ObjectMapper objectMapper = new ObjectMapper();
            String argumentJson = objectMapper.writeValueAsString(workflowArgs);

            Execution execution = Execution.newBuilder()
                    .setArgument(argumentJson)
                    .build();

            // Trigger the workflow execution in Google Cloud
            CreateExecutionRequest createExecutionRequest = CreateExecutionRequest.newBuilder()
                    .setParent(workflow.toString())
                    .setExecution(execution)
                    .build();

            Execution response = executionsClient.createExecution(createExecutionRequest);

            // Extract the unique Execution ID (which looks like
            // projects/.../executions/12345)
            // We just want the UUID at the end to use as our Firestore Document ID
            String executionName = response.getName();
            String executionId = executionName.substring(executionName.lastIndexOf("/") + 1);

            System.out.println("Triggered Google Cloud Workflow! Execution ID: " + executionId);

            Map<String, String> responseBody = new HashMap<>();
            responseBody.put("executionId", executionId);

            return ResponseEntity.ok(responseBody);

        } catch (IOException e) {
            System.err.println("Failed to trigger Google Cloud Workflow: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // The resume endpoint will take the summary and post it to the callback URL
    @PostMapping("/resume/{executionId}")
    public ResponseEntity<Map<String, String>> resumeWorkflow(@PathVariable String executionId,
            @RequestBody Map<String, String> request) {
        String summary = request.get("summary");
        String callbackUrl = request.get("callbackUrl");

        if (summary == null || callbackUrl == null) {
            return ResponseEntity.badRequest().build();
        }

        try {
            // Forward the payload to the Google Cloud Workflows Callback URL
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

            // The Cloud Workflows callback expects a JSON body
            GoogleCredentials credentials = GoogleCredentials.getApplicationDefault()
                    .createScoped(Collections.singletonList("https://www.googleapis.com/auth/cloud-platform"));
            credentials.refreshIfExpired();
            String token = credentials.getAccessToken().getTokenValue();

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            Map<String, String> body = new HashMap<>();
            body.put("summary", summary);

            org.springframework.http.HttpEntity<Map<String, String>> entity = new org.springframework.http.HttpEntity<>(
                    body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(callbackUrl, entity, String.class);

            System.out.println("Forwarded callback to workflow: " + response.getStatusCode());
            return ResponseEntity.ok(Collections.singletonMap("status", "Resumed"));

        } catch (Exception e) {
            System.err.println("Failed to resume workflow: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
