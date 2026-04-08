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
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.dom4j.Document;
import org.dom4j.Element;

import info.esblurock.background.services.dataset.user.GetUserAccountAndDatabasePersonProcess;
import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

@RestController
public class LoginController {

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody String bodyS, @RequestHeader("Authorization") String authHeader) {
        Document document = MessageConstructor.startDocument("First Login");
        String idToken = authHeader.split(" ")[1];
        FirebaseToken decodedToken;
        try {
            decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();
           
            Element body = MessageConstructor.isolateBody(document);
            body.addElement("div").addText("UID from token: " + uid);
            JsonObject databody = JsonObjectUtilities.jsonObjectFromString(bodyS);

            JsonObject userdata = databody.get("user").getAsJsonObject();
            String uidFromClient = userdata.get("uid").getAsString();
            String email = userdata.get("email").getAsString();
            String username = email;
            JsonElement name = userdata.get("displayname");
            if(name != null && !name.isJsonNull()) {
                username = name.getAsString();
            }
            
            String authtype = userdata.get("providerId").getAsString();
            JsonObject answer = null;
            if (uid.equals(uidFromClient)) {
                String service = databody.get("service").getAsString();
                if (service.equals("dataset:FirstLoginService")) {
                    answer = firstLogin(document, uid, idToken, email, username, authtype);
                } else {
                    answer = StandardResponse.standardErrorResponse(document, "No Login service: " + service, null);
                }
            } else {
                answer = StandardResponse.standardErrorResponse(document, "UIDs do not match", null);
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(JsonObjectUtilities.toString(answer));
        } catch (FirebaseAuthException e) {
            JsonObject answer = StandardResponse.standardErrorResponse(document,
                    "Error in Authorization: Login session expired\n" + e.getMessage(), null);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(JsonObjectUtilities.toString(answer));
        } catch (Exception e) {
            JsonObject answer = StandardResponse.standardErrorResponse(document, "General Error: " + e.getMessage(), null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(JsonObjectUtilities.toString(answer));
        }
    }

    private JsonObject firstLogin(Document document, String uid, String idToken, String email, String username, String authtype) {
        JsonObject response = null;
        JsonObject empty = CreateDocumentTemplate.createTemplate("dataset:LoginAccountInformation");
        JsonObject firestoreid = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(empty);
        firestoreid.addProperty(ClassLabelConstants.SimpleCatalogName, uid);
        JsonObject loginaccountresponse = ReadFirestoreInformation.readFirestoreCatalogObject(firestoreid);
        if (loginaccountresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
            JsonObject loginaccount = loginaccountresponse.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
            JsonObject firstloginresponse = new JsonObject();
            firstloginresponse.add(ClassLabelConstants.LoginAccountInformation, loginaccount);

            JsonObject getnewaccount = new JsonObject();
            getnewaccount.addProperty(ClassLabelConstants.UID, uid);
            JsonObject newaccountresponse = GetUserAccountAndDatabasePersonProcess.get(getnewaccount);
            if (newaccountresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                JsonArray objarr = newaccountresponse.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
                JsonObject pair = objarr.get(0).getAsJsonObject();
                JsonObject useraccount = pair.get(ClassLabelConstants.UserAccount).getAsJsonObject();
                JsonObject person = pair.get(ClassLabelConstants.DatabasePerson).getAsJsonObject();

                firstloginresponse.add(ClassLabelConstants.DatabasePerson, person);
                firstloginresponse.add(ClassLabelConstants.UserAccount, useraccount);
                firstloginresponse.addProperty(ClassLabelConstants.LoginStage, "dataset:LoginRegistration");
                JsonArray arr = new JsonArray();
                arr.add(firstloginresponse);
                response = StandardResponse.standardServiceResponse(document,
                        "Successful creation of LoginAccountInformation", arr);
            } else {
                firstloginresponse.addProperty(ClassLabelConstants.LoginStage, "dataset:LoginAccountInformation");
                JsonArray arr = new JsonArray();
                arr.add(firstloginresponse);
                response = StandardResponse.standardServiceResponse(document,
                        "LoginAccountInformation exists, but not Account info: ", arr);
            }
        } else {
            JsonObject loginaccount = CreateDocumentTemplate.createTemplate("dataset:LoginAccountInformation");
            loginaccount.addProperty(ClassLabelConstants.UID, uid);
            loginaccount.addProperty(ClassLabelConstants.Email, email);
            loginaccount.addProperty(ClassLabelConstants.IDToken, idToken);
            loginaccount.addProperty(ClassLabelConstants.username, username);
            loginaccount.addProperty(ClassLabelConstants.AuthorizationType, authtype);
            assignAccountRole(loginaccount);
            BaseCatalogData.insertStandardBaseInformation(loginaccount, uid, uid, "false");
            JsonObject firstloginresponse = new JsonObject();
            firstloginresponse.add(ClassLabelConstants.LoginAccountInformation, loginaccount);
            firstloginresponse.addProperty(ClassLabelConstants.LoginStage, "dataset:LoginAuthenticated");
            try {
                WriteFirestoreCatalogObject.writeCatalogObjectWithException(loginaccount);
                JsonArray arr = new JsonArray();
                arr.add(firstloginresponse);
                response = StandardResponse.standardServiceResponse(document,
                        "Successful creation of LoginAccountInformation", arr);
            } catch (Exception ex) {
                ex.printStackTrace();
                response = StandardResponse.standardErrorResponse(document,
                        "Error in writing LoginAccountInformation: " + ex.getMessage(), null);
            }
        }
        return response;
    }

    private void assignAccountRole(JsonObject accountinfo) {
        String role = "dataset:StandardUser";
        String email = accountinfo.get(ClassLabelConstants.Email).getAsString();
        if (email.equals("edward.blurock@gmail.com")) {
            role = "dataset:Administrator";
        }
        accountinfo.addProperty(ClassLabelConstants.UserAccountRole, role);
    }
}
