package info.esblurock.background.services.dataset.user;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.SubstituteJsonValues;

public class CreateDatabasePersonTransaction {

	public static JsonObject create(JsonObject event, JsonObject info, boolean writecatalog) {
		String owner = event.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
		String transactionID = event.get(ClassLabelConstants.TransactionID).getAsString();
		Document document = MessageConstructor.startDocument("CreateDatabasePersonEvent");
		JsonObject response = null;
		try {
			JsonObject catalog = substituteAndWriteDatabasePerson(event, document, info, owner, transactionID,
					writecatalog);
			JsonArray catalogarr = new JsonArray();
			catalogarr.add(catalog);
			JsonObject descr = catalog.get(ClassLabelConstants.DataDescriptionPerson).getAsJsonObject();
			String title = descr.get(ClassLabelConstants.DescriptionTitlePerson).getAsString();
			String message = "Successful creation of DatabasePerson: " + title;
			response = StandardResponse.standardServiceResponse(document, message, catalogarr);
		} catch (Exception ex) {
			ex.printStackTrace();
			String errormessage = "Failed (" + ex.getClass().getCanonicalName() + ") create DatabasePerson: "
					+ ex.getMessage();
			response = StandardResponse.standardErrorResponse(document, errormessage, null);
		}
		return response;
	}

	public static JsonObject substituteAndWriteDatabasePerson(JsonObject event, Document document, JsonObject source,
			String owner, String transID, boolean writecatalog) throws Exception {
		Element body = MessageConstructor.isolateBody(document);
		String classname = "dataset:DatabasePerson";
		String makepublic = "true";
		if (source.get(ClassLabelConstants.MakePublicRead) != null) {
			makepublic = source.get(ClassLabelConstants.MakePublicRead).getAsString();
		}
		body.addElement("div").addText("Maker Public: " + makepublic);
		JsonObject catalog = BaseCatalogData.createStandardDatabaseObject(classname, owner, transID, makepublic);
		String identifier = catalog.get(AnnotationObjectsLabels.identifier).getAsString();
		SubstituteJsonValues.substituteJsonObject(catalog, source);
		
		System.out.println("CreateDatabasePersonTransaction: source: " + JsonObjectUtilities.toString(source));
		System.out.println("CreateDatabasePersonTransaction: catalog: " + JsonObjectUtilities.toString(catalog));
		
		JsonObject descr = source.get(ClassLabelConstants.DataDescriptionPerson).getAsJsonObject();
		JsonObject personnameJsonObject = catalog.get(ClassLabelConstants.PersonalDescription).getAsJsonObject();
		JsonObject personname = personnameJsonObject.get(ClassLabelConstants.NameOfPerson).getAsJsonObject();
		String firstname = personname.get(ClassLabelConstants.givenName).getAsString();
		String lastname = personname.get(ClassLabelConstants.familyName).getAsString();
		String fullname = firstname + " " + lastname;
		
		JsonObject contact = CreateDocumentTemplate.createTemplate("dataset:ContactInfoData");
		String infoemail = source.get(ClassLabelConstants.Email).getAsString();
		
		contact.addProperty(ClassLabelConstants.ContactKey, infoemail);
		contact.addProperty(ClassLabelConstants.ContactType, "dataset:EmailContactType");
		JsonArray contactArray = catalog.get(ClassLabelConstants.ContactInfoData).getAsJsonArray();
		contactArray.add(contact);
		String useraccountrole = source.get(ClassLabelConstants.UserAccountRole).getAsString();
		descr.addProperty(ClassLabelConstants.DescriptionKeywordPerson,useraccountrole);
		personname.addProperty(ClassLabelConstants.PersonFullName, fullname);
		catalog.addProperty(ClassLabelConstants.ShortDescription, fullname);
		catalog.addProperty(AnnotationObjectsLabels.identifier, identifier);
		JsonObject transfirestoreID = event.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
		catalog.add(ClassLabelConstants.FirestoreCatalogIDForTransaction, transfirestoreID.deepCopy());

		JsonObject firestoreID = BaseCatalogData.insertFirestoreAddress(catalog);
		body.addElement("pre").addText("Writing DatabasePerson to:\n" + JsonObjectUtilities.toString(firestoreID));
		if (writecatalog) {
			String message = WriteFirestoreCatalogObject.writeCatalogObjectWithException(catalog);
			body.addElement("pre").addText(message);
		}
		return catalog;
	}

}
