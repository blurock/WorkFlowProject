package info.esblurock.background.services.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;

import com.google.gson.JsonObject;
import org.dom4j.Document;

import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

@RestController
public class CatalogInformationController {

    @GetMapping("/cataloginfo")
    public ResponseEntity<String> getCatalogInfo(@RequestParam("catalogname") String catalogname) {
        if (!catalogname.startsWith("dataset:")) {
            catalogname = "dataset:" + catalogname;
        }
        Document document = MessageConstructor.startDocument("DatasetCollectionDocumentIDPairForHierarchy");
        JsonObject catalogandanno = CreateDocumentTemplate.createTemplateWithAnnotations(catalogname);
        
        JsonObject serveresponse = StandardResponse.standardServiceResponse(document,
                "Success: DatasetCollectionDocumentIDPairForHierarchy", catalogandanno);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(JsonObjectUtilities.toString(serveresponse));
    }
}
