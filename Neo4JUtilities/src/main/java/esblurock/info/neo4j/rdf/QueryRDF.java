package esblurock.info.neo4j.rdf;

import java.util.HashMap;
import java.util.Map;

import org.dom4j.Document;
import org.dom4j.Element;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.Value;
import org.neo4j.driver.exceptions.NoSuchRecordException;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import esblurock.info.neo4j.utilities.Neo4JInitialization;

import org.neo4j.driver.Record;

import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;

public class QueryRDF {

	public static JsonObject retreiveSubjectObjectWithRelation(String relationString, String owner, String title) {
		RDFQueryInput input = new RDFQueryInput(null, owner, null, "MATCH", "subject,object");
		input.addRelation(relationString, null);
		QueryAndProperties queryprops = executeMATCHQuery(input);
		return executeQuery(queryprops.getQuery(), queryprops.getProperties().get(0), title);
	}

	public static JsonObject retreiveSubjectNodeWithProperty(String label, String property, String owner,
			String title) {
		Map<String, Object> properties = new java.util.HashMap<String, Object>();
		properties.put(label, property);
		RDFQueryInput input = new RDFQueryInput(null, owner, null, "MATCH", "relation,object");
		input.setSubjectprops(properties);
		QueryAndProperties queryprops = executeMATCHQuery(input);
		return executeQuery(queryprops.getQuery(), queryprops.getProperties().get(0), title);
	}

	public static QueryAndProperties executeMATCHQuery(RDFQueryInput input) {
		Map<String, Object> proplst = new HashMap<String, Object>();
		String subjectnodeString = JsonToCypherUtilities.createNodeWithProperties(input.getSubjectClassString(),
				input.getSubjectprops(),
				input.getOwner(),
				true, proplst, false);
		String predicateString = JsonToCypherUtilities.createRelation(input.getRelationClass(),
				input.getRelationprops(),
				input.getTransactionID(), input.getOwner(),
				proplst);
		String objectnodeString = JsonToCypherUtilities.createNodeWithProperties(input.getObjectClass(),
				input.getObjectprops(),
				input.getOwner(),
				false, proplst, false);

		StringBuffer buffer = new StringBuffer();
		buffer.append("MATCH ");
		buffer.append(subjectnodeString);
		buffer.append("-");
		buffer.append(predicateString);
		buffer.append("->");
		buffer.append(objectnodeString);
		buffer.append(" RETURN ");
		buffer.append(input.getReturnString());
		QueryAndProperties queryprops = new QueryAndProperties(input.getTitle(), buffer.toString());
		queryprops.addProperties(proplst);
		System.out.println("QueryProps: " + queryprops.toString());
		return queryprops;
	}

	public static JsonObject executeQuery(String query, Map<String, Object> properties, String title) {
		Document docmessage = MessageConstructor.startDocument(title);
		Element body = MessageConstructor.isolateBody(docmessage);
		body.addElement("h3").addText(title);
		body.addElement("pre").addText("Query: " + query);
		JsonObject response = null;
		JsonArray resultarray = new JsonArray();
		try (Session session = Neo4JInitialization.getDriver().session()) {
			Result result = session.run(query, properties);

			while (result.hasNext()) {
				Element tableElement = body.addElement("table").addAttribute("style", "border: 1px solid black;");
				Element headElement = tableElement.addElement("thead");
				Element headrowElement = headElement.addElement("tr");
				headrowElement.addElement("th").addText("Return").addAttribute("style", "border: 1px solid black;");
				;
				headrowElement.addElement("th").addText("Key").addAttribute("style", "border: 1px solid black;");
				;
				headrowElement.addElement("th").addText("Result").addAttribute("style", "border: 1px solid black;");
				;
				Element bodyElement = tableElement.addElement("tbody");

				Record record = result.next();
				JsonObject recordjson = new JsonObject();
				for (String recordkey : record.keys()) {

					RDFReturnValues returnValue = RDFReturnValues.valueOf(recordkey);
					Value nodeValue = record.get(recordkey);
					JsonObject resultJsonObject = returnValue.returnObject(nodeValue, bodyElement);
					recordjson.add(recordkey, resultJsonObject);
				}
				resultarray.add(recordjson);
			}
			String mtitle = "Successful query";
			response = StandardResponse.standardServiceResponse(docmessage, mtitle, resultarray);
		} catch (NoSuchRecordException e) {
			String mtitle = "No records found for the given query.";
			response = StandardResponse.standardServiceResponse(docmessage, mtitle, null);
		} catch (Exception e) {
			body.addElement("div").addText("Error opening driver: " + e.toString());
			e.printStackTrace();
		}

		return response;

	}
}
