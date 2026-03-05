package info.blurock.workflow.controller;

import info.blurock.workflow.dto.ChatRequest;
import info.blurock.workflow.dto.ChatResponse;
import info.blurock.workflow.service.DictionarySearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:4200") // Allow Angular dev server
public class ChatController {

    private final DictionarySearchService discoveryEngineService;

    @Autowired
    public ChatController(DictionarySearchService discoveryEngineService) {
        this.discoveryEngineService = discoveryEngineService;
    }

    @PostMapping("/search")
    public ResponseEntity<ChatResponse> handleChatPrompt(@RequestBody ChatRequest request) {
        try {
            // Hardcoding the datatype filter as requested
            String bestMatch = discoveryEngineService.searchDictionaryTerm(
                    request.getPrompt(),
                    "exampledatasettransactions");
            return ResponseEntity.ok(new ChatResponse(bestMatch));
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
