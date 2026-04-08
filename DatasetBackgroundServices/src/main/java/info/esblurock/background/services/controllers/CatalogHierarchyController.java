package info.esblurock.background.services.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;

import com.google.gson.JsonObject;
import org.dom4j.Document;

import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
public class CatalogHierarchyController {
    private static final Logger logger = LoggerFactory.getLogger(CatalogHierarchyController.class);

    @GetMapping("/api/getfirestorepath")
    public ResponseEntity<String> getHierarchy(@RequestParam("json") String jsonString) {
        logger.info("GET /api/getfirestorepath with json: {}", jsonString);
        if (jsonString != null) {
            JsonObject json = JsonObjectUtilities.jsonObjectFromString(jsonString);
            return generateResponse(json);
        }
        return ResponseEntity.badRequest().body("Missing json parameter");
    }

    @PostMapping(value = "/api/getfirestorepath", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> postHierarchy(@RequestBody String body) {
        logger.info("POST /api/getfirestorepath with body: {}", body);
        JsonObject json = JsonObjectUtilities.jsonObjectFromString(body);
        return generateResponse(json);
    }

    private ResponseEntity<String> generateResponse(JsonObject json) {
        try {
            logger.info("Generating hierarchy for JSON: {}", JsonObjectUtilities.toString(json));
            JsonObject firestoreID = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(json);
            if (firestoreID == null) {
                logger.warn("Could not find hierarchy for given JSON");
                return ResponseEntity.status(404).body("Hierarchy not found for given object");
            }
            
            String path = CreateHierarchyElement.getPathFromFirestoreID(firestoreID);
            logger.info("Generated path: {}", path);

            Document document = MessageConstructor.startDocument("DatasetCollectionDocumentIDPairForHierarchy");
            JsonObject data = new JsonObject();
            data.addProperty("path", path);

            JsonObject serveresponse = StandardResponse.standardServiceResponse(document,
                    "Success: Firestore path generated", data);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(JsonObjectUtilities.toString(serveresponse));
        } catch (Exception e) {
            logger.error("Error generating hierarchy: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Internal error: " + e.getMessage());
        }
    }
}
