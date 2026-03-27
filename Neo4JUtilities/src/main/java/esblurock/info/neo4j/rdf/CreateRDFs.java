package esblurock.info.neo4j.rdf;

import static org.hamcrest.CoreMatchers.nullValue;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.dom4j.Document;
import org.dom4j.Element;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.Transaction;
import org.neo4j.driver.Record;
import org.neo4j.driver.summary.ResultSummary;
import org.neo4j.driver.summary.SummaryCounters;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import esblurock.info.neo4j.rdf.JsonToCypherUtilities;
import esblurock.info.neo4j.rdf.MapOfQueryAndProperties;
import esblurock.info.neo4j.utilities.Neo4JInitialization;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class CreateRDFs {

	public static boolean createRDFFromObjectArray(JsonArray arr, Document document) {
		Element body = MessageConstructor.isolateBody(document);
		boolean noerror = true;
		try (Session session = Neo4JInitialization.getDriver().session()) {
			Transaction transaction = session.beginTransaction();

			for (int i = 0; i < arr.size(); i++) {
				JsonObject catalog = arr.get(i).getAsJsonObject();
				noerror = noerror && CreateRDFs.createRDFFromObject(transaction, catalog, document);
			}
			transaction.commit();
		} catch (Exception e) {
			body.addElement("div").addText("Error in creating RDFs for an array of catalog objects: " + e.toString());
			e.printStackTrace();
		}
		return noerror;
	}

	public static boolean createRDFFromObject(JsonObject catalog, Document document) {
		Element body = MessageConstructor.isolateBody(document);
		boolean noerror = true;
		try (Session session = Neo4JInitialization.getDriver().session()) {
			Transaction transaction = session.beginTransaction();
			noerror = CreateRDFs.createRDFFromObject(transaction, catalog, document);
			transaction.commit();
		} catch (Exception e) {
			body.addElement("div").addText("Error in creating RDFs for single catalog object: " + e.toString());
			e.printStackTrace();
		}
		return noerror;
	}
	
	public static boolean createRDFFromObject(Transaction transaction, JsonObject catalog, Document document) {
		Element body = MessageConstructor.isolateBody(document);
		boolean noerror = true;
		JsonObject responseJsonObject = CreateRDFs.createRDFFromCatalogObject(transaction, catalog, document);
		if (responseJsonObject.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
		} else {
			noerror = false;
			String message = responseJsonObject.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
			body.addElement("div").addText("Error in RDF generation: Object ID:"
					+ catalog.get(ClassLabelConstants.CatalogObjectID).getAsString());
			body.addElement("div").addText("Error in RDF generation: " + message);
		}
		return noerror;
	}

	public static JsonObject createRDFFromCatalogObject(JsonObject obj) {
		JsonObject responseJson = null;
		Document docmessage = MessageConstructor.startDocument("Create RDFs From CatalogObject");
		Element body = MessageConstructor.isolateBody(docmessage);
		try (Session session = Neo4JInitialization.getDriver().session()) {
		
		Transaction transaction = session.beginTransaction();
		responseJson = createRDFFromCatalogObject(transaction, obj, docmessage); 
		transaction.commit();
		} catch (Exception e) {
			body.addElement("div").addText("Error in creating RDFs in standalone catalog object: " + e.toString());
			e.printStackTrace();
		}
		return responseJson;
	}
	
	public static JsonObject createRDFFromCatalogObject(Transaction transaction, JsonObject obj) {
		Document docmessage = MessageConstructor.startDocument("Create RDFs From CatalogObject");
		return createRDFFromCatalogObject(transaction, obj, docmessage);
	}

	public static JsonObject createRDFFromCatalogObject(Transaction transaction, JsonObject obj, Document docmessage) {
		Element body = MessageConstructor.isolateBody(docmessage);
		JsonObject response = null;
		String rdfpredicateString = ClassLabelConstants.RDFPredicate;
		body.addElement("h3").addText("Create RDFs From CatalogObject using RDF TransactionID: "
				+ obj.get(ClassLabelConstants.TransactionID).getAsString());
		MapOfQueryAndProperties cypherquery = JsonToCypherUtilities.createSimpleRelation(obj);
		Set<String> keyStrings = cypherquery.keySet();
		JsonArray jsonarray = new JsonArray();
		for (String key : keyStrings) {
			JsonObject jsonobject = new JsonObject();
			jsonarray.add(jsonobject);
			jsonobject.addProperty(rdfpredicateString, key);
			body.addElement("h3").addText(key);
			QueryAndProperties queryprops = cypherquery.getQuery(key);
			String query = queryprops.getQuery();
			List<Map<String, Object>> properties = queryprops.getProperties();
			int nodesCreated = 0;
			int relationshipsCreated = 0;
			body.addElement("pre").addText("Map Sets: " + properties.size());
			JsonArray jsonproperties = new JsonArray();

			for (Map<String, Object> map : properties) {
				Result result = transaction.run(query, map);
				while (result.hasNext()) {
					Record record = result.next();
					Map<String, Object> resultmap = record.asMap();
					for (String resultkey : resultmap.keySet()) {
						String object = (String) map.get(resultkey);
						jsonproperties.add(object);
					}
				}
				ResultSummary summary = result.consume();
				SummaryCounters counters = summary.counters();
				nodesCreated = nodesCreated + counters.nodesCreated();
				relationshipsCreated = relationshipsCreated + counters.relationshipsCreated();
			}
			body.addElement("pre").addText("Nodes Created: " + nodesCreated);
			body.addElement("pre").addText("Relationships Created: " + relationshipsCreated);
		}
		response = StandardResponse.standardServiceResponse(docmessage, "Created RDFs", jsonarray);
		return response;
	}
}
