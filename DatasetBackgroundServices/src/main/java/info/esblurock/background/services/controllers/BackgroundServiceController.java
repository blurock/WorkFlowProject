package info.esblurock.background.services.controllers;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.gson.JsonObject;
import org.dom4j.Document;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

@RestController
public class BackgroundServiceController {

    @PostMapping("/service")
    public ResponseEntity<String> processService(@RequestBody String bodyS, @RequestHeader("Authorization") String authHeader) {
        JsonObject body = JsonObjectUtilities.jsonObjectFromString(bodyS);
        String uidfrombody = body.get("uid").getAsString();
        String idToken = authHeader.split(" ")[1];

        FirebaseToken decodedToken;
        JsonObject answer = null;
        try {
            if (!idToken.equals("null")) {
                decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
                String uid = decodedToken.getUid();
                if (uidfrombody.equals(uid)) {
                    answer = DatabaseServicesBase.process(body);
                } else {
                    Document document = MessageConstructor.startDocument("Service fatal error UID mismatch");
                    answer = StandardResponse.standardErrorResponse(document, "UIDs illegal token, user not signed in", null);
                }
            } else {
                if (uidfrombody.equals("Guest")) {
                    answer = DatabaseServicesBase.process(body);
                } else {
                    Document document = MessageConstructor.startDocument("Service fatal error Guest login");
                    answer = StandardResponse.standardErrorResponse(document, "Illegal Guest process", null);
                }
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(JsonObjectUtilities.toString(answer));
        } catch (FirebaseAuthException e) {
            Document document = MessageConstructor.startDocument("Service fatal error");
            answer = StandardResponse.standardErrorResponse(document, "Firebase error: " + e.getMessage(), null);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(JsonObjectUtilities.toString(answer));
        } catch (Exception e) {
            Document document = MessageConstructor.startDocument("General error");
            answer = StandardResponse.standardErrorResponse(document, "Error: " + e.getMessage(), null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(JsonObjectUtilities.toString(answer));
        }
    }
}
