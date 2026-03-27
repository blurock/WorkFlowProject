package info.esblurock.background.services.dataset.user;

import java.util.ArrayList;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import info.esblurock.background.services.dataset.ManageDatasetDocumentLists;
import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class CreateUserAccountTransaction {

    public static JsonObject create(JsonObject event, JsonObject prerequisites, JsonObject info, boolean writecatalog) {
		JsonObject personid = prerequisites.get("dataset:eventcreateperson").getAsJsonObject();
				
        return createUserAccount(event, personid, info, writecatalog);
    }

    public static JsonObject createUserAccount(JsonObject event, JsonObject personid, JsonObject info,
            boolean writecatalog) {
        JsonObject response = null;
        String uid = info.get(ClassLabelConstants.UID).getAsString();
        Document document = MessageConstructor.startDocument("CreateUserAccountTransaction: " + uid);
        Element body = MessageConstructor.isolateBody(document);
        ArrayList<String> accountids = getUserAccountNameIDs(uid);
        if (accountids != null) {
            accountids.add(uid);
            String owner = event.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
            String transactionID = event.get(ClassLabelConstants.TransactionID).getAsString();

            JsonObject catalog = CreateDocumentTemplate.createTemplate("dataset:UserAccount");
            JsonObject useraccountdescription = catalog.get(ClassLabelConstants.DataDescriptionUserAccount)
                    .getAsJsonObject();
            JsonObject infodescription = info.get(ClassLabelConstants.DataDescriptionPerson).getAsJsonObject();
            
            String infoabstract = infodescription.get(ClassLabelConstants.DescriptionAbstractPerson).getAsString();
            String infotitle = infodescription.get(ClassLabelConstants.DescriptionTitlePerson).getAsString();
            JsonElement keyselement = infodescription.get(ClassLabelConstants.DescriptionKeywordPerson);
            String keys = "";
            if(keyselement.isJsonArray()) {
            	JsonArray JAkeys = (JsonArray) keyselement;
            	for(int i=0; i<JAkeys.size(); i++) {
            		if(i!=0)
            			keys = keys + ",";
            		keys = keys + JAkeys.get(i).getAsString();
            	}
            } else {
            	keys = keyselement.getAsString();
            }
            useraccountdescription.addProperty(ClassLabelConstants.DescriptionAbstractUserAccount, infoabstract);
            useraccountdescription.addProperty(ClassLabelConstants.DescriptionTitleUserAccount, infotitle);
            useraccountdescription.addProperty(ClassLabelConstants.DescriptionKeywordUserAccount, keys);
            JsonObject infopurpcon = infodescription.get(ClassLabelConstants.PurposeConceptPerson).getAsJsonObject();
            String infopurpose = infopurpcon.get(ClassLabelConstants.PurposePerson).getAsString();
            String infoconcept = infopurpcon.get(ClassLabelConstants.ConceptPerson).getAsString();
            JsonObject useraccountpurpcon = useraccountdescription.get(ClassLabelConstants.PurposeConceptUserAccount)
                    .getAsJsonObject();
            useraccountpurpcon.addProperty(ClassLabelConstants.PurposeUserAccount, infopurpose);
            useraccountpurpcon.addProperty(ClassLabelConstants.ConceptUserAccount, infoconcept);

            String infoauthtype = info.get(ClassLabelConstants.AuthorizationType).getAsString();
            String infoemail = info.get(ClassLabelConstants.Email).getAsString();
            String inforole = info.get(ClassLabelConstants.UserAccountRole).getAsString();
            String username = info.get(ClassLabelConstants.username).getAsString();
            catalog.addProperty(ClassLabelConstants.AuthorizationType, infoauthtype);
            catalog.addProperty(ClassLabelConstants.UID, uid);
            catalog.addProperty(ClassLabelConstants.Email, infoemail);
            catalog.addProperty(ClassLabelConstants.UserAccountRole, inforole);
            catalog.addProperty(ClassLabelConstants.username, username);
            String shortdescription = "UserAccount for " + username + ": " + inforole + " (" + uid + ")";
            catalog.addProperty(ClassLabelConstants.ShortDescription, shortdescription);
            JsonObject transfirestoreID = event.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
            catalog.add(ClassLabelConstants.FirestoreCatalogIDForTransaction, transfirestoreID.deepCopy());
            BaseCatalogData.insertStandardBaseInformation(catalog, owner, transactionID, "false", false);
            JsonObject firestoreID = BaseCatalogData.insertFirestoreAddress(catalog);
            body.addElement("pre").addText("Writing UserAccount to:\n" + JsonObjectUtilities.toString(firestoreID));

            // Write to database
            if (writecatalog) {
                try {
                    writeUserAccount(catalog, body);
                } catch (Exception e) {
                    response = StandardResponse.standardErrorResponse(document,
                            "Error in writing UserAccount: '" + username + "'", null);
                }
            }
            JsonArray catalogarr = new JsonArray();
            catalogarr.add(catalog);
            response = StandardResponse.standardServiceResponse(document, "Sucesss: CreateUserAccountEvent",
                    catalogarr);

        } else {
            response = StandardResponse.standardErrorResponse(document,
                    "UserAccount already exists: '" + uid + "'", null);
        }
        return response;
    }

    public static void writeUserAccount(JsonObject useraccount, Element body) throws Exception {
        ArrayList<String> accountids = ManageDatasetDocumentLists.getCollectionIDsForClass("dataset:UserAccount");
        String uid = useraccount.get(ClassLabelConstants.UID).getAsString();
        accountids.add(uid);
        JsonObject firestoreID = useraccount.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
        JsonObject cpy = firestoreID.deepCopy();
        ManageDatasetDocumentLists.writeCollectionIDs(accountids, cpy);
        String message = WriteFirestoreCatalogObject.writeCatalogObjectWithException(useraccount);
        body.addElement("pre").addText(message);
    }

    public static ArrayList<String> getUserAccountNameIDs(String username) {
        String classname = "dataset:UserAccount";
        ArrayList<String> accountids = ManageDatasetDocumentLists.getCollectionIDsForClass(classname);
        if (accountids.contains(username)) {
            accountids = null;
        } else {
            
        }
        return accountids;
    }

}
