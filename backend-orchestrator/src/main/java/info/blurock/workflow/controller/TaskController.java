package info.blurock.workflow.controller;

import info.blurock.workflow.dto.ChatRequest;
import info.blurock.workflow.dto.ChatResponse;
import info.blurock.workflow.service.DictionarySearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final DictionarySearchService dictionarySearchService;

    public TaskController(DictionarySearchService dictionarySearchService) {
        this.dictionarySearchService = dictionarySearchService;
    }

    /**
     * Workflow Step: Search Dictionary
     * This endpoint is called directly by the Google Cloud Workflow.
     */
    @PostMapping("/dictionary-search")
    public ResponseEntity<ChatResponse> searchDictionaryTask(@RequestBody ChatRequest request) {
        try {
            System.out.println("Workflow Task Triggered: Searching for term: " + request.getPrompt());

            // The workflow is looking for the "exampledatasettransactions" datatype
            String result = dictionarySearchService.searchDictionaryTerm(request.getPrompt(),
                    "exampledatasettransactions");

            return ResponseEntity.ok(new ChatResponse(result));

        } catch (IOException e) {
            System.err.println("Error calling Discovery Engine: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
