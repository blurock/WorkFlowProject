package esblurock.info.neo4j.rdf;

import static org.hamcrest.CoreMatchers.nullValue;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.checkerframework.common.returnsreceiver.qual.This;
import org.dom4j.Document;
import org.dom4j.Element;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.types.Node;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import esblurock.info.neo4j.rdf.generalquery.GeneralRDFQueryDefinition;
import esblurock.info.neo4j.utilities.Neo4JInitialization;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.constants.OntologyObjectLabels;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.CreateDocumentTableUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;

public class RDFQuestionsUtilities {
	
	/**
	 * @param input: The input parameters as a JSON object
	 * @return response of the Query
	 * 
	 * This is converts the JSON property value pairs
	 * that are needed for the query relation into the SetOfPropertyValueQueryPairs
	 * and then calls RDFGeneralQuery
	 * 
	 */
	public static JsonObject RDFGeneralQueryWithJson(JsonObject input) {
		String relationNameString = input.get(ClassLabelConstants.RDFRelationClassName).getAsString();
		GeneralRDFQueryDefinition rdfquery = new GeneralRDFQueryDefinition(relationNameString);
		List<String> entities = OntologyUtilityRoutines.exactlyOnePropertyMultiple(relationNameString, OntologyObjectLabels.entity);
		List<String> subjects = OntologyUtilityRoutines.exactlyOnePropertyMultiple(relationNameString, OntologyObjectLabels.subject);
		Set<String> totalList = new HashSet<String>();
 		totalList.addAll(entities);
 		totalList.addAll(subjects);
 		totalList.add("dataset:CatalogObjectOwner");
 		JsonObjectUtilities.replaceIdentifiersWithPropertyValuePairs(input, totalList);
 		JsonObject propertiesJsonObject = input.get(ClassLabelConstants.SetOfPropertyValueQueryPairs).getAsJsonObject();
		JsonObject responseJsonObject = rdfquery.searchWithProperties(propertiesJsonObject);
		return responseJsonObject;
	}
	
	/**
	 * @param input with the relation and the set of property value pairs
	 * @return response of the Query
	 * 
	 *  RDFRelationClassName: The RDF relation
	 *  SetOfPropertyValueQueryPairs: The set of property value pairs
	 * 
	 */
	public static JsonObject RDFGeneralQuery(JsonObject input) {
		String relationString = input.get(ClassLabelConstants.RDFRelationClassName).getAsString();
		JsonObject propertiesJsonObject = input.get(ClassLabelConstants.SetOfPropertyValueQueryPairs).getAsJsonObject();
		GeneralRDFQueryDefinition rdfquery = new GeneralRDFQueryDefinition(relationString);
		JsonObject responseJsonObject = rdfquery.searchWithProperties(propertiesJsonObject);
		return responseJsonObject;
	}

	/*
	 * FindListOfCatalogObjectUniqueGenericLabel
	 * 
	 * Find the list of CatalogObjectUniqueGenericLabel. This is to provide the set
	 * of datasets that are available for an owner.
	 * 
	 * Input: CatalogObjectOwner Output: List of CatalogObjectUniqueGenericLabel
	 */
	public static JsonObject FindListOfCatalogObjectUniqueGenericLabel(JsonObject input) {

		String owner = null;
		if (input.get(ClassLabelConstants.CatalogObjectOwner) != null) {
			owner = input.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
		}

		String title = "List of CatalogObjectUniqueGenericLabel";
		JsonObject response = null;
		String query = "MATCH (s)-[:RDFCatalogObjectUniqueGenericLabel]->(o) RETURN DISTINCT s.uniquegenericname AS label ORDER BY label";
		String querywithowner = "MATCH (s  {creator: $owner})-[:RDFCatalogObjectUniqueGenericLabel]->(o) RETURN DISTINCT s.uniquegenericname AS label ORDER BY label";
		Map<String, Object> properties = new java.util.HashMap<String, Object>();

		Document docmessage = MessageConstructor.startDocument(title);
		Element body = MessageConstructor.isolateBody(docmessage);
		body.addElement("h3").addText(title);

		if (owner != null) {
			properties.put("owner", owner);
			query = querywithowner;
			body.addElement("div").addText("owner: " + owner);
		}
		body.addElement("pre").addText("Query: " + query);

		JsonObject object = new JsonObject();

		try (Session session = Neo4JInitialization.getDriver().session()) {
			Result result = session.run(query, properties);
			JsonArray resultarray = new JsonArray();
			while (result.hasNext()) {
				var record = result.next();
				String label = record.get("label").asString();
				resultarray.add(label);
				body.addElement("div").addText(label);
			}
			object.add(ClassLabelConstants.CatalogObjectUniqueGenericLabel, resultarray);
			response = StandardResponse.standardServiceResponse(docmessage, "List of CatalogObjectUniqueGenericLabel",
					object);
		} catch (Exception e) {
			response = StandardResponse.standardErrorResponse(docmessage,
					"Error in finding CatalogObjectUniqueGenericLabel: " + e.getMessage(), null);
		}
		return response;
	}

	/*
	 * CatalogObjectsFromUniqueGenericLabel Find the information of all the catalog
	 * objects with the unique generic name and of a certain type.
	 * 
	 * Input: CatalogObjectOwner CatalogObjectUniqueGenericLabel DatabaseObjectType
	 * Output: CatalogObjectsFromUniqueGenericLabelAndType
	 * 
	 * Example query MATCH (s {uniquegenericname: "SmallTableA1CarbonBensonRules",
	 * creator: "Administrator"}) -[r:RDFCatalogObjectUniqueGenericLabel]->(o) WHERE
	 * o.objecttype = "dataset:RepositoryTherGasThermodynamicsBlock" RETURN o
	 */
	public static JsonObject CatalogObjectsFromUniqueGenericLabel(JsonObject input) {
		JsonObject responseJson = null;
		boolean propertiesfound = true;
		int count = 0;
		String title = "Catalog Objects with UniqueGenericLabel";
		Document docmessage = MessageConstructor.startDocument(title);
		Element body = MessageConstructor.isolateBody(docmessage);
		body.addElement("h3").addText(title);

		JsonObject summaryJsonObject = CreateDocumentTemplate
				.createTemplate("dataset:CatalogObjectsFromUniqueGenericLabelAndType");
		Map<String, Object> properties = new java.util.HashMap<String, Object>();
		String owner = "";
		if (input.get(ClassLabelConstants.CatalogObjectOwner) != null) {
			owner = input.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
			properties.put("owner", owner);
			summaryJsonObject.addProperty(ClassLabelConstants.CatalogObjectOwner, owner);
			body.addElement("div").addText("CatalogObjectOwner: " + owner);
		} else {
			propertiesfound = false;
		}
		String unique = "";
		if (input.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel) != null) {
			unique = input.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			properties.put("uniquename", unique);
			summaryJsonObject.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, unique);
			body.addElement("div").addText("CatalogObjectUniqueGenericLabel: " + unique);
		} else {
			propertiesfound = false;
		}
		String type = "";
		if (input.get(ClassLabelConstants.DatabaseObjectType) != null) {
			type = input.get(ClassLabelConstants.DatabaseObjectType).getAsString();
			properties.put("type", type);
			summaryJsonObject.addProperty(ClassLabelConstants.DatabaseObjectType, type);
			body.addElement("div").addText("DatabaseObjectType: " + type);
		} else {
			propertiesfound = false;
		}
		if (propertiesfound) {
			try (Session session = Neo4JInitialization.getDriver().session()) {
				String queryString = "MATCH (s {uniquegenericname: $uniquename, creator: $owner})"
						+ "-[r:RDFCatalogObjectUniqueGenericLabel]->(o) " + "WHERE o.objecttype = $type " + "RETURN o";
				body.addElement("pre").addText("Query: " + queryString);
				JsonArray lstArray = new JsonArray();
				summaryJsonObject.add(ClassLabelConstants.CatalogObjectInformation, lstArray);
				Result result = session.run(queryString, properties);

				while (result.hasNext()) {
					count++;
					var record = result.next();
					Node node = record.get("o").asNode();
					Map<String, Object> map = node.asMap();
					JsonObject infoObject = CreateDocumentTemplate.createTemplate("dataset:CatalogObjectInformation");
					String shortdescription = (String) map.get("shortdescription");
					String catobjid = (String) map.get("catobjid");
					String transactionid = (String) map.get("transactionid");
					String firestorecatalog = (String) map.get("firestorecatalog");
					JsonObject firestoreJsonObject = JsonObjectUtilities.jsonObjectFromString(firestorecatalog);
					infoObject.addProperty(ClassLabelConstants.ShortDescription, shortdescription);
					infoObject.addProperty(ClassLabelConstants.CatalogObjectID, catobjid);
					infoObject.addProperty(ClassLabelConstants.TransactionID, transactionid);
					infoObject.addProperty(ClassLabelConstants.ShortDescription, shortdescription);
					infoObject.add(ClassLabelConstants.FirestoreCatalogID, firestoreJsonObject);

					lstArray.add(infoObject);
				}
			} catch (Exception e) {
				System.err.println("No session");
				e.printStackTrace();
				System.err.println(e);
			}
			String titleString = "Success: " + count + " catalog objects found with label and type";
			JsonArray catalogArray = new JsonArray();
			catalogArray.add(summaryJsonObject);
			responseJson = StandardResponse.standardServiceResponse(docmessage, titleString, catalogArray);
		}
		return responseJson;
	}

	/*
	 * FindTreeOfPrerequisiteTransactions
	 * 
	 * The tree of prerequisites from a given transaction. The tree gives all the
	 * prerequisite information that is needed to get to the current transaction.
	 * Since within the transactions, the list of catalog object that are formed
	 * within a given transaction, this implies that one can find all the
	 * prerequisite objects also.
	 * 
	 * Input: CatalogObjectOwner TransactionID DescriptionTitle
	 * 
	 * Output: CatalogObjectPrerequisiteTree
	 * 
	 */
	public static JsonObject FindTreeOfPrerequisiteTransactions(JsonObject input) {
		String owner = null;
		JsonObject response = null;
		String title = "Tree of Prerequiste Transactions";
		Document docmessage = MessageConstructor.startDocument(title);
		if (input.get(ClassLabelConstants.CatalogObjectOwner) != null) {
			owner = input.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
		}
		if (input.get(ClassLabelConstants.TransactionID) != null) {
			String transactionid = input.get(ClassLabelConstants.TransactionID).getAsString();
			String descriptionString = transactionid;
			if (input.get(ClassLabelConstants.DescriptionTitle) != null) {
				descriptionString = input.get(ClassLabelConstants.DescriptionTitle).getAsString();
			}
			JsonObject topnodeJsonObject = CreateDocumentTemplate
					.createTemplate("dataset:CatalogObjectPrerequisiteTree");
			topnodeJsonObject.addProperty(ClassLabelConstants.DescriptionTitle, descriptionString);
			topnodeJsonObject.addProperty(ClassLabelConstants.TransactionID, transactionid);

			String querywithowner = "MATCH (s {transactionid: $transactionid creator: $owner})-[:RDFRequiredTransactionInformation]->(o) RETURN o";
			Element body = MessageConstructor.isolateBody(docmessage);
			body.addElement("h3").addText(title);
			body.addElement("pre").addText("Query: " + querywithowner);
			if (owner != null) {
				body.addElement("div").addText("owner: " + owner);
			}
			JsonArray levelArray = findSubNode(owner, transactionid);
			topnodeJsonObject.add(ClassLabelConstants.CatalogObjectPrerequisiteTreeNode, levelArray);

			JsonArray catalogArray = new JsonArray();
			catalogArray.add(topnodeJsonObject);

			String titleString = "Successful: Prerequisite Tree for TransactionID=" + transactionid;
			response = StandardResponse.standardServiceResponse(docmessage, titleString, catalogArray);
		} else {
			String error = "TransactionID not given as input";
			response = StandardResponse.standardErrorResponse(docmessage, error, null);
		}
		return response;
	}

	public static JsonArray findSubNode(String owner, String transactionid) {
		JsonArray levelArray = new JsonArray();
		JsonArray levelArrayTransactions = findTransactionPrerequisites(owner, transactionid);
		for (int i = 0; i < levelArrayTransactions.size(); i++) {
			JsonObject infObject = levelArrayTransactions.get(i).getAsJsonObject();
			JsonObject infonodeJsonObject = CreateDocumentTemplate
					.createTemplate("dataset:CatalogObjectPrerequisiteTreeNode", false);
			String subtransactionid = infObject.get(ClassLabelConstants.RequiredTransactionID).getAsString();
			JsonArray sublevelArray = findSubNode(owner, subtransactionid);
			infonodeJsonObject.add(ClassLabelConstants.RequiredTransactionInformation, infObject);
			infonodeJsonObject.add(ClassLabelConstants.CatalogObjectPrerequisiteTreeNode, sublevelArray);
			levelArray.add(infonodeJsonObject);
		}
		return levelArray;
	}

	public static JsonArray findTransactionPrerequisites(String owner, String transactionid) {
		JsonArray prerequisitesArray = new JsonArray();
		Map<String, Object> properties = new java.util.HashMap<String, Object>();
		String querywithowner = "MATCH (s {transactionid: $transactionid, creator: $owner})-[:RDFRequiredTransactionInformation]->(object) RETURN object";
		String query = "MATCH (s {transactionid: $transactionid})-[:RDFRequiredTransactionInformation]->(object) RETURN object";

		if (owner != null) {
			properties.put("owner", owner);
			query = querywithowner;
		}
		properties.put("transactionid", transactionid);
		//Driver driver = Neo4JInitialization.initDriver();

		try (Session session = Neo4JInitialization.getDriver().session();
				) {
			Result result = session.run(query, properties);
			while (result.hasNext()) {
				var record = result.next();
				Node node = record.get("object").asNode();
				Map<String, Object> map = node.asMap();
				String requiredtransactioninfo = (String) map.get("requiredtransactioninfo");
				JsonObject prerequisiteJsonObject = JsonObjectUtilities.jsonObjectFromString(requiredtransactioninfo);
				prerequisitesArray.add(prerequisiteJsonObject);
			}
		} catch (Exception e) {
			System.err.println("No session");
			e.printStackTrace();
			System.err.println(e);
			prerequisitesArray = null;
		}
		return prerequisitesArray;
	}

	/*
	 * The purpose of this query is to find the benson rules with a specific center
	 * atom and return the name of the benson rule and the generic label of the
	 * corresponding dataset. The catalog object address and the catalog id of each
	 * object is given to be able to retrieve the object.
	 * 
	 * Find all Benson rules with 'bensoncenteratom' as the center atom in all
	 * dataset objects. This search is only for data set objects,
	 * ThermodynamicBensonRuleDefinitionDataSet. One of the output objects is
	 * CatalogObjectUniqueGenericLabel. The (user friendly) name of the benson rule
	 * is given. The catalog object is specified by the catalog id and the firestore
	 * address.
	 * 
	 * Input: CatalogObjectOwner 
	 *        JThermodynamicsBensonCenterAtom
	 *        CatalogObjectUniqueGenericLabel (optional)
	 * 
	 * Output: List of objects with: 
	 *     - CatalogObjectUniqueGenericLabel
	 *     - ShortDescription 
	 *     - CatalogObjectID 
	 *     - FirestoreCatalogID
	 * 
	 */
	public static JsonObject findDataSetObjectsWithCenterAtom(JsonObject input) {
		JsonObject response = null;
		String title = "Dataset Objects with Specific Center Atom";
		Document docmessage = MessageConstructor.startDocument(title);
		Element body = MessageConstructor.isolateBody(docmessage);
		body.addElement("h3").addText(title);

		JsonArray centeratomobjects = new JsonArray();
		
		Map<String, Object> properties = new java.util.HashMap<String, Object>();
		properties.put("objecttype", "dataset:ThermodynamicBensonRuleDefinitionDataSet");
		String centerString = input.get(ClassLabelConstants.JThermodynamicsBensonCenterAtom).getAsString();
		properties.put("bensoncenteratom", centerString);
	    String owner = input.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
	    properties.put("owner", owner);

		String queryString = "CALL "
				+ "{MATCH (s {bensoncenteratom: $bensoncenteratom, creator: $owner})-[ r:RDFJThermodynamicsBensonCenterAtom]->( o {objecttype: $objecttype}) "
				+ "RETURN s.bensoncenteratom as center,o.shortdescription as descr, o.catobjid as id" + "} "
				+ "MATCH (s2)-[:RDFCatalogObjectUniqueGenericLabel]->(o2) where o2.catobjid = id " + "RETURN id, descr,"
				+ "s2.uniquegenericname as name," + "o2.firestorecatalog as address";

		if(input.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel) != null) {
	    	String labelString = input.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
	    	properties.put("uniquegenericname",labelString);
	    	queryString = "CALL "
					+ "{MATCH (s {bensoncenteratom: $bensoncenteratom, creator: $owner})"
					+ "-[ r:RDFJThermodynamicsBensonCenterAtom]->"
					+ "( o {objecttype: $objecttype}) "
					+ "RETURN s.bensoncenteratom as center,o.shortdescription as descr, o.catobjid as id" + "} "
					+ "MATCH (s2  {uniquegenericname: $uniquegenericname})-[:RDFCatalogObjectUniqueGenericLabel]->(o2) where o2.catobjid = id " + "RETURN id, descr,"
					+ "s2.uniquegenericname as name," + "o2.firestorecatalog as address";
	    }
		ArrayList<String> headerList = new ArrayList<String>();
		headerList.add("Catalog ID");
		headerList.add("Unique Label");
		headerList.add("Benson Rule");
		Element tbody = CreateDocumentTableUtilities.createTableWithHeader(body, headerList);
		try (Session session = Neo4JInitialization.getDriver().session()) {
			Result result = session.run(queryString, properties);
			while (result.hasNext()) {
				var record = result.next();
				String id = record.get("id").asString();
				String bensonrule = record.get("descr").asString();
				String uniquegenericname = record.get("name").asString();
				String firestoreidS = record.get("address").asString();
				JsonObject firestore = JsonObjectUtilities.jsonObjectFromString(firestoreidS);
				
				ArrayList<String> rowValueStrings = new ArrayList<>();
				rowValueStrings.add(id);
				rowValueStrings.add(uniquegenericname);
				rowValueStrings.add("\'" + bensonrule + "\'");
				CreateDocumentTableUtilities.createTableRow(tbody, rowValueStrings);
				JsonObject answer = new JsonObject();
				answer.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, uniquegenericname);
				answer.addProperty(ClassLabelConstants.ShortDescription, bensonrule);
				answer.addProperty(ClassLabelConstants.CatalogObjectID, id);
				answer.add(ClassLabelConstants.FirestoreCatalogID, firestore);

				centeratomobjects.add(answer);
			}
		} catch (Exception e) {
			e.printStackTrace();
			response = StandardResponse.standardErrorResponse(docmessage,"Error in opening Neo4J session",null);
		}
		String titleString = "Successful: Catalog objects with center atom=" + centerString;
		response = StandardResponse.standardServiceResponse(docmessage, titleString, centeratomobjects);
		return response;
	}
}
