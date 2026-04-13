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

        String uid = null;
        JsonObject answer = null;
        try {
            if (!idToken.equals("null")) {
                // Determine if it's a Firebase token or a Google OIDC token (Workflow)
                // Firebase tokens usually have an issuer like "securetoken.google.com"
                // Orchestrator tokens from Google Cloud have an audience of the service URL.
                
                try {
                    // Try Firebase first (Human user)
                    FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
                    uid = decodedToken.getUid();
                } catch (FirebaseAuthException e) {
                    if (e.getMessage().contains("incorrect \"aud\" (audience) claim")) {
                        // Likely a Workflow token. Verify using Google IdToken Verifier.
                        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                            .setAudience(Collections.singletonList("https://dataset-background-services-315685320181.europe-west1.run.app/service"))
                            .build();
                        GoogleIdToken googleIdToken = verifier.verify(idToken);
                        if (googleIdToken != null) {
                            // For workflows, the "uid" might be the service account email or subject
                            uid = googleIdToken.getPayload().getSubject();
                            // System.out.println("Verified Workflow OIDC token for subject: " + uid);
                            
                            // Bypass UID mismatch check for workflow calls if necessary, 
                            // or ensure the workflow sends the correct UID in the payload.
                        } else {
                            throw e; // Re-throw if even Google verifier fails
                        }
                    } else {
                        throw e;
                    }
                }

                if (uid != null && (uidfrombody.equals(uid) || uidfrombody.equals("Guest") || isWorkflowSubject(uid))) {
                    answer = DatabaseServicesBase.process(body);
                } else {
                    Document document = MessageConstructor.startDocument("Service fatal error UID mismatch");
                    answer = StandardResponse.standardErrorResponse(document, "UIDs illegal token: " + uid + " != " + uidfrombody, null);
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
            System.err.println("=== UNCAUGHT BACKEND SERVICE EXCEPTION ===");
            e.printStackTrace();
            Document document = MessageConstructor.startDocument("General error");
            answer = StandardResponse.standardErrorResponse(document, "Error: " + e.getMessage(), null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(JsonObjectUtilities.toString(answer));
        }
    }

    private boolean isWorkflowSubject(String subject) {
        // You can add logic here to white-list specific workflow service accounts if needed
        return subject != null && subject.length() > 0;
    }
}
