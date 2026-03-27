package info.esblurock.background.services.dataset.user;

import java.util.ArrayList;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.background.services.transaction.TransactionProcess;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class InitializerUserAccountTransaction {

    public static JsonObject create(JsonObject event, JsonObject info) {
        JsonObject response = null;
        String username = info.get(ClassLabelConstants.username).getAsString();
        String uid = info.get(ClassLabelConstants.UID).getAsString();
        Document document = MessageConstructor.startDocument("CreateUserAccountTransaction: " + uid);
        ArrayList<String> accountids = CreateUserAccountTransaction.getUserAccountNameIDs(uid);
        JsonObject transfirestoreID = BaseCatalogData.insertFirestoreAddress(event);

        if (accountids != null) {
            JsonObject personresponse = CreateDatabasePersonTransaction.create(event, info, false);
            if (personresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                JsonArray databasepersonarray = personresponse.get(ClassLabelConstants.SimpleCatalogObject)
                        .getAsJsonArray();
                JsonObject databaseperson = databasepersonarray.get(0).getAsJsonObject();
                JsonObject databasepersonid = databaseperson.get(ClassLabelConstants.FirestoreCatalogID)
                        .getAsJsonObject();
                JsonObject accountresponse = CreateUserAccountTransaction.createUserAccount(event, databasepersonid,
                        info, false);
                MessageConstructor.combineBodyIntoDocument(document,
                        personresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
                if (accountresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
                    Element body = MessageConstructor.isolateBody(document);
                    String transactionID = event.get(ClassLabelConstants.TransactionID).getAsString();
                    JsonArray accountarray = accountresponse.get(ClassLabelConstants.SimpleCatalogObject)
                            .getAsJsonArray();
                    JsonObject useraccount = accountarray.get(0).getAsJsonObject();
                    JsonObject accounttransactionid = useraccount.get(ClassLabelConstants.FirestoreCatalogID)
                            .getAsJsonObject();
                    JsonObject initializedaccount = BaseCatalogData
                            .createStandardDatabaseObject("dataset:NewUserAccount", uid, transactionID, "false");
                    initializedaccount.add(ClassLabelConstants.DatabasePersonObjectID, databasepersonid);
                    initializedaccount.add(ClassLabelConstants.UserAccountObjectID, accounttransactionid);
                    initializedaccount.addProperty(ClassLabelConstants.username, username);
                    initializedaccount.addProperty(ClassLabelConstants.UID, uid);
                    initializedaccount.add(ClassLabelConstants.FirestoreCatalogIDForTransaction,
                            transfirestoreID.deepCopy());
                    initializedaccount.addProperty(ClassLabelConstants.LoginStage, "dataset:LoginRegistration");
                    String shortdescription = "New User Account for: " + username + " (" + uid + ")";
                    initializedaccount.addProperty(ClassLabelConstants.ShortDescription, shortdescription);
                    BaseCatalogData.insertStandardBaseInformation(initializedaccount, uid, transactionID, "false",
                            false);
                    JsonObject firestoreID = BaseCatalogData.insertFirestoreAddress(initializedaccount);
                    body.addElement("pre").addText("Writing UserAccount initialization object to:\n"
                            + JsonObjectUtilities.toString(firestoreID));
                    try {
                        CreateUserAccountTransaction.writeUserAccount(useraccount, body);
                        String personmessage = WriteFirestoreCatalogObject
                                .writeCatalogObjectWithException(databaseperson);
                        body.addElement("pre").addText(personmessage);
                        String message = WriteFirestoreCatalogObject
                                .writeCatalogObjectWithException(initializedaccount);
                        body.addElement("div").addText(message);
                        JsonArray catalogarr = new JsonArray();
                        catalogarr.add(initializedaccount);
                        catalogarr.add(databaseperson);
                        catalogarr.add(useraccount);
                        //JsonObject responseoutput = new JsonObject();
                        
                        //responseoutput.add(ClassLabelConstants.NewUserAccount, initializedaccount);
                        //responseoutput.add(ClassLabelConstants.DatabasePerson, databaseperson);
                        //responseoutput.add(ClassLabelConstants.UserAccount, useraccount);
                        //responseoutput.addProperty(ClassLabelConstants.UID, uid);
                        //JsonObject firebaseid = initializedaccount.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
                        //responseoutput.add(ClassLabelConstants.FirestoreCatalogID,firebaseid);
                        //catalogarr.add(responseoutput);
                        String success = "Success in creating a new UserAccount: " + uid;
                        response = StandardResponse.standardServiceResponse(document, success, catalogarr);
                    } catch (Exception e) {
                        MessageConstructor.combineBodyIntoDocument(document,
                                personresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
                        response = StandardResponse.standardErrorResponse(document,
                                "Error in writing user Account object", null);
                    }
                } else {
                    response = StandardResponse.standardErrorResponse(document, "Error in creating UserAccount",
                            null);
                }
            } else {
                MessageConstructor.combineBodyIntoDocument(document,
                        personresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
                response = StandardResponse.standardErrorResponse(document, "Error in creating DatabasePerson",
                        null);
            }

        } else {
            response = StandardResponse.standardErrorResponse(document,
                    "UserAccount already exists: '" + uid + "'", null);
        }

        return response;
    }

}
