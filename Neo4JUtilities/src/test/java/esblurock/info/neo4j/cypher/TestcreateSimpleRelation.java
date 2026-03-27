package esblurock.info.neo4j.cypher;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import esblurock.info.neo4j.rdf.CreateRDFs;
import esblurock.info.neo4j.rdf.JsonToCypherUtilities;
import esblurock.info.neo4j.rdf.MapOfQueryAndProperties;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.SubstituteJsonValues;

public class TestcreateSimpleRelation {

	@Test
	public void test() {
		String classname = "dataset:DatabasePerson";
		String owner = "Administration";
		String transID = BaseCatalogData.generateUniqueUUID();
		JsonObject obj = BaseCatalogData.createStandardDatabaseObject(classname, owner, transID, "true");
		BaseCatalogData.insertCatalogObjectKey(obj, classname);
		SubstituteJsonValues.substituteJsonValueString(obj, ClassLabelConstants.DOI, "DOI value");
		SubstituteJsonValues.substituteJsonValueString(obj, ClassLabelConstants.PersonFullName, "Edward Blurock");
		SubstituteJsonValues.substituteJsonValueString(obj, ClassLabelConstants.givenName, "Edward");
		SubstituteJsonValues.substituteJsonValueString(obj, ClassLabelConstants.familyName, "Blurock");
		SubstituteJsonValues.substituteJsonValueString(obj, ClassLabelConstants.ShortDescription, "Edward S. Blurock");
		SubstituteJsonValues.substituteJsonValueString(obj, ClassLabelConstants.CatalogObjectKey, "11111111");
		SubstituteJsonValues.substituteJsonValueString(obj, ClassLabelConstants.TransactionID, "transactionid");
		SubstituteJsonValues.substituteJsonValueString(obj, ClassLabelConstants.TransactionIDinRDF, "transactionidrdf");
		SubstituteJsonValues.substituteJsonValueString(obj, ClassLabelConstants.ShortDescription, "description");

		String httpclass = ClassLabelConstants.HTTPAddress;
		String objectsiteaddressString = "dataset:ObjectSiteReference";

		JsonObject http1 = CreateDocumentTemplate.createTemplate(objectsiteaddressString);
		JsonObject http2 = CreateDocumentTemplate.createTemplate(objectsiteaddressString);
		JsonObject http3 = CreateDocumentTemplate.createTemplate(objectsiteaddressString);
		http1.addProperty(ClassLabelConstants.HTTPAddress, "http://www.1");
		http2.addProperty(ClassLabelConstants.HTTPAddress, "http://www.2");
		http3.addProperty(ClassLabelConstants.HTTPAddress, "http://3");
		JsonArray httpaddresses = new JsonArray();
		httpaddresses.add(http1);
		httpaddresses.add(http2);
		httpaddresses.add(http3);

		obj.add(ClassLabelConstants.ObjectSiteReference, httpaddresses);

		System.out.println(JsonObjectUtilities.toString(obj));

		System.out.println("RUN TEST");
		try {
			JsonObject responseJsonObject = CreateRDFs.createRDFFromCatalogObject(obj);

			JsonObjectUtilities.printResponse(responseJsonObject);
		} catch (Exception ex) {
			ex.printStackTrace();
		}
		;
	}

}
