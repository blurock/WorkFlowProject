package info.blurock.datamanager.controller;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.blurock.datamanager.termextraction.ExtractedTerm;
import info.blurock.datamanager.termextraction.TermExtractionService;
import org.dom4j.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/termextraction")
public class TermExtractionController {

    @Autowired
    private TermExtractionService termExtractionService;

    /**
     * POST /api/termextraction/extract
     *
     * Body: { "prompt": "...", "termSet": "...", "maxResults": 10 }
     *
     * Returns a standard service response where dataset:simpcatobj is a
     * JsonArray of { term, value, description } objects.
     */
    @PostMapping(value = "/extract", produces = "application/json")
    public String extractTerms(@RequestBody Map<String, Object> params) {
        Document doc = MessageConstructor.startDocument("TermExtraction");
        try {
            String prompt  = (String) params.getOrDefault("prompt", "");
            String termSet = (String) params.getOrDefault("termSet", "");
            int maxResults = params.containsKey("maxResults")
                ? Integer.parseInt(params.get("maxResults").toString())
                : 10;

            if (prompt.isBlank() || termSet.isBlank()) {
                return StandardResponse.standardErrorResponse(
                    doc, "Both 'prompt' and 'termSet' are required.", new JsonArray()
                ).toString();
            }

            System.out.println("TermExtractionController: prompt='" + prompt + "', termSet='" + termSet + "'");

            List<ExtractedTerm> terms = termExtractionService.extractTerms(prompt, termSet, maxResults);

            JsonArray resultArray = new JsonArray();
            for (ExtractedTerm t : terms) {
                resultArray.add(t.toJsonObject());
            }

            String message = "Extracted " + terms.size() + " term(s) from prompt.";
            return StandardResponse.standardServiceResponse(doc, message, resultArray).toString();

        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in TermExtractionController: " + e.getMessage());
            e.printStackTrace();
            return StandardResponse.standardErrorResponse(
                doc, "Server error: " + e.getMessage(), new JsonArray()
            ).toString();
        }
    }
}
