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
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.util.Collections;
import com.google.gson.JsonObject;
import org.dom4j.Document;

import info.esblurock.background.services.transaction.TransactionProcess;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

@RestController
public class BackgroundTransactionController {

    @PostMapping("/transaction")
    public ResponseEntity<String> processTransaction(@RequestBody String bodyS,
            @RequestHeader("Authorization") String authHeader) {
        String idToken = authHeader.split(" ")[1];
        String uid = null;
        JsonObject answer = null;
        JsonObject body = JsonObjectUtilities.jsonObjectFromString(bodyS);
        String uidfrombody = body.get("uid").getAsString();
        try {
            if (!idToken.equals("null")) {
                try {
                    // Try Firebase first (Human user)
                    FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
                    uid = decodedToken.getUid();
                } catch (FirebaseAuthException e) {
                    if (e.getMessage().contains("incorrect \"aud\" (audience) claim")) {
                        // Likely a Workflow token. Verify using Google IdToken Verifier.
                        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(),
                                new GsonFactory())
                                .setAudience(Collections.singletonList(
                                        "https://dataset-background-services-315685320181.europe-west1.run.app/transaction"))
                                .build();
                        GoogleIdToken googleIdToken = verifier.verify(idToken);
                        if (googleIdToken != null) {
                            uid = googleIdToken.getPayload().getSubject();
                        } else {
                            throw e;
                        }
                    } else {
                        throw e;
                    }
                }

                if (uid != null && (uidfrombody.equals(uid) || uidfrombody.equals("Guest") || isWorkflowSubject(uid))) {
                    answer = TransactionProcess.processFromTransaction(body, uid);
                } else {
                    Document document = MessageConstructor.startDocument("Service fatal error UID mismatch");
                    answer = StandardResponse.standardErrorResponse(document,
                            "UIDs illegal token: " + uid + " != " + uidfrombody, null);
                }
            } else {
                Document document = MessageConstructor.startDocument("Transaction fatal error UID mismatch");
                answer = StandardResponse.standardErrorResponse(null, "UIDs illegal token, user not signed in", null);
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
            System.err.println("=== UNCAUGHT TRANSACTION EXCEPTION ===");
            e.printStackTrace();
            Document document = MessageConstructor.startDocument("General error");
            answer = StandardResponse.standardErrorResponse(document, "Error: " + e.getMessage(), null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(JsonObjectUtilities.toString(answer));
        }
    }

    private boolean isWorkflowSubject(String subject) {
        return subject != null && subject.length() > 0;
    }
}
