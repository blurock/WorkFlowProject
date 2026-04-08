package info.esblurock.background.services.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;
import org.dom4j.Document;
import org.dom4j.Element;

import info.esblurock.background.services.firestore.FirestoreBaseClass;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

import java.util.HashMap;
import java.util.Map;

@RestController
public class WriteFirestoreController {

    @GetMapping("/writeempty")
    public ResponseEntity<String> writeEmpty(@RequestParam("catalogname") String catalogname) {
        Document document = MessageConstructor.startDocument("WriteFirestoreData empty object: ");
        Element body = MessageConstructor.isolateBody(document);
        try {
            body.addElement("h3").addText("Catalog name: " + catalogname);
            Firestore db = FirestoreBaseClass.getFirebaseDatabase();
            DocumentReference docRef = db.collection("empty").document("catalog");
            String owner = "Blurock";
            String transID = "transactionID value";
            String publicaccess = "true";
            JsonObject obj = BaseCatalogData.createStandardDatabaseObject(catalogname, owner, transID, publicaccess);
            
            body.addElement("pre").addText(JsonObjectUtilities.toString(obj));
            Map<String, Object> mapObj = new Gson().fromJson(obj, new TypeToken<HashMap<String, Object>>() {
            }.getType());
            
            WriteResult result = docRef.set(mapObj).get();
            body.addElement("h3").addText("\nSuccessful write to empty/catalog: " + result.getUpdateTime());
            
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(MessageConstructor.DocumentToString(document));
        } catch (Exception e) {
            MessageConstructor.combineBodyIntoDocument(document, e.toString());
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.TEXT_HTML)
                    .body(MessageConstructor.DocumentToString(document));
        }
    }
}
