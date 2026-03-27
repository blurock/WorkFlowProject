package esblurock.info.neo4j.rdf.generalquery;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.dom4j.Document;
import org.dom4j.Element;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import esblurock.info.neo4j.utilities.Neo4JInitialization;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.constants.OntologyObjectLabels;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.CreateDocumentTableUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;

public class GeneralRDFQueryDefinition {
	LisOfRDFDefinitions subjectDefinitions;
	LisOfRDFDefinitions objectDefinitions;
	String relationNameString;
	
	LisOfRDFDefinitions subjectpropsDefinitions;
	LisOfRDFDefinitions objectspropsDefinitions;
	LisOfRDFDefinitions subjectpropsNotInDefinitions;
	LisOfRDFDefinitions objectpropsNotInDefinitions;
	
	JsonObject propertiesJsonObjects;
	ListOfRDFpropertyDefinitionWithValue propertiesRdfDefinitions;
	
	Map<String, Object> propertiesMap;
	
	public GeneralRDFQueryDefinition(String relation) {
		this.relationNameString = relation;
	}
	
	public JsonObject searchWithProperties(JsonObject properties) {
		this.propertiesJsonObjects = properties;
		this.propertiesRdfDefinitions = new ListOfRDFpropertyDefinitionWithValue(properties);
		this.propertyMap();
		JsonObject responseJsonObject = null;
		
		String title = "Run " + relationNameString + " Query";
		Document docmessage = MessageConstructor.startDocument(title);
		Element body = MessageConstructor.isolateBody(docmessage);
		
		addPropertyTable(body);

		List<String> entities = OntologyUtilityRoutines.exactlyOnePropertyMultiple(relationNameString, OntologyObjectLabels.entity);
		objectDefinitions = new LisOfRDFDefinitions(entities);
		List<String> subjects = OntologyUtilityRoutines.exactlyOnePropertyMultiple(relationNameString, OntologyObjectLabels.subject);
		subjectDefinitions = new LisOfRDFDefinitions(subjects);
		
		subjectpropsDefinitions = subjectDefinitions.propertiesInDefinitions(this.propertiesRdfDefinitions);
		objectspropsDefinitions = objectDefinitions.propertiesInDefinitions(this.propertiesRdfDefinitions);
		subjectpropsNotInDefinitions = subjectDefinitions.propertiesNotInDefinitions(this.propertiesRdfDefinitions);
		objectpropsNotInDefinitions = objectDefinitions.propertiesNotInDefinitions(this.propertiesRdfDefinitions);

		
		String queryString = queryTemplate(this.propertiesRdfDefinitions);
		body.addElement("div").addText(queryString);
		
		
		
		responseJsonObject = runQuery(docmessage);
		
		
		return responseJsonObject;
	}
	
	public void propertyMap() {
		propertiesMap = new java.util.HashMap<String, Object>();
		Set<String> keySet = propertiesRdfDefinitions.keySet();
		for(String key :keySet) {
			RDFpropertyDefinitionWithValue definition = propertiesRdfDefinitions.getByKey(key);
			propertiesMap.put(definition.getAltLabelString(),definition.getValue());
		}
	}
	
	public void addPropertyTable(Element body) {
		Set<String> keySet = this.propertiesRdfDefinitions.keySet();
		List<String> keyList = new ArrayList<String>(keySet);
		Element tablElement = CreateDocumentTableUtilities.createTableWithHeader(body, keyList);
		
		List<String> propStrings = new ArrayList<>();
		for(String key: keySet) {
			RDFPropertyDefinition definition = propertiesRdfDefinitions.getByKey(key);
			propStrings.add(definition.getAltLabelString());
		}
		CreateDocumentTableUtilities.createTableRow(tablElement, propStrings);
			
	}
	
	public JsonObject runQuery(Document docmessage) {
		JsonObject responseJsonObject = null;
		String queryString = queryTemplate(this.propertiesRdfDefinitions);
		Element body = MessageConstructor.isolateBody(docmessage);
		LisOfRDFDefinitions resultsdefDefinitions = new LisOfRDFDefinitions();
		resultsdefDefinitions.addAll(subjectpropsNotInDefinitions);
		resultsdefDefinitions.addAll(objectpropsNotInDefinitions);
		
		
		Element tbodyElement = resultTable(body,resultsdefDefinitions);

		try (Session session = Neo4JInitialization.getDriver().session()) {
			Result result = session.run(queryString , this.propertiesMap);
			JsonObject resultJsonObject = CreateDocumentTemplate.createTemplate("dataset:RDFGeneralQueryResult");
			resultJsonObject.addProperty(ClassLabelConstants.RDFRelationClassName, this.relationNameString);
			resultJsonObject.add(ClassLabelConstants.SetOfPropertyValueQueryPairs, this.propertiesJsonObjects);
			resultJsonObject.add(ClassLabelConstants.RDFPropertyDefinition, resultsdefDefinitions.toJsonArray());
			JsonArray rowarray = new JsonArray();
			resultJsonObject.add(ClassLabelConstants.RDFGeneralQueryResultRow, rowarray);
			while (result.hasNext()) {
				ListOfRDFpropertyDefinitionWithValue resultvalues = extractResult(result,resultsdefDefinitions,tbodyElement);
				JsonObject resultvaluesArray = resultvalues.toJsonResultRow();
				rowarray.add(resultvaluesArray);
			}
			String titleString = "Success at running " + this.relationNameString;
			JsonArray resultarray = new JsonArray();
			resultarray.add(resultJsonObject);
			responseJsonObject = StandardResponse.standardServiceResponse(docmessage, titleString, resultarray);

			session.close();
		} catch (Exception e) {
			responseJsonObject = StandardResponse.standardErrorResponse(docmessage,
					"Query session error: " + e.getMessage(), null);
			e.printStackTrace();
		}
		
		return responseJsonObject;
	}
	
	Element resultTable(Element body,LisOfRDFDefinitions results) {
		List<String> nameList = new ArrayList<String>();
		for(String key: results.keySet()) {
			RDFPropertyDefinition def = results.getDefinition(key);
			String altlabelString = def.getAltLabelString();
			nameList.add(altlabelString);
		}
		Element tablElement = CreateDocumentTableUtilities.createTableWithHeader(body, nameList);
		return tablElement;
	}
	
	ListOfRDFpropertyDefinitionWithValue extractResult(Result result, LisOfRDFDefinitions results, Element tbodyElement) {
		var record = result.next();
		List<String> valueArrayList = new ArrayList<String>();
		ListOfRDFpropertyDefinitionWithValue resultvaluesDefinitionWithValue = new ListOfRDFpropertyDefinitionWithValue();
		for(String key: results.keySet()) {
			RDFPropertyDefinition def = results.getDefinition(key);
			String altlabelString = def.getAltLabelString();
			String resultString = record.get(altlabelString).asString();
			RDFpropertyDefinitionWithValue propertyDefinitionWithValue = new RDFpropertyDefinitionWithValue(def.getPropertyClassString(),resultString);
			valueArrayList.add(resultString);
			resultvaluesDefinitionWithValue.addValue(propertyDefinitionWithValue);
		}
		CreateDocumentTableUtilities.createTableRow(tbodyElement, valueArrayList);
		return resultvaluesDefinitionWithValue;
	}
	
	String queryTemplate(ListOfRDFpropertyDefinitionWithValue properties) {
		StringBuffer totalQueryString = new StringBuffer();
		
		
		String subjectPropertyString = propertyString(subjectpropsDefinitions);
		String objectPropertyString = propertyString(objectspropsDefinitions);
		
		
		String subjectOutput = outputRETURNString(subjectpropsNotInDefinitions,true);
		
		String objectOutput = outputRETURNString(objectpropsNotInDefinitions,false);
		
		String relationString = relationNameString.substring(8);
		
		totalQueryString.append("MATCH ");
		totalQueryString.append("(subject ");
		totalQueryString.append(subjectPropertyString);
		totalQueryString.append(")-[:");
		totalQueryString.append(relationString);
		totalQueryString.append("]->(object ");
		totalQueryString.append(objectPropertyString);
		totalQueryString.append(") RETURN ");
		totalQueryString.append(subjectOutput);
		if(subjectOutput.length() > 0) {
			totalQueryString.append(", ");
		}
		totalQueryString.append(objectOutput);
		totalQueryString.append(";");
		
		return totalQueryString.toString();
	}
	
	String outputRETURNString(LisOfRDFDefinitions properties, boolean subject) {
		StringBuffer outputBuffer = new StringBuffer();
		String sourceString = "object.";
		if(subject) {
			sourceString = "subject.";
		}
		boolean notfirst = false;
		Set<String> keySet = properties.keySet();
		for(String key: keySet) {
			RDFPropertyDefinition property = properties.getDefinition(key);
			if(notfirst) {
				outputBuffer.append(", ");
			} else {
				notfirst = true;
			}
			String altlabelString = property.getAltLabelString();
			outputBuffer.append(sourceString);
			outputBuffer.append(altlabelString);
			outputBuffer.append(" as ");
			outputBuffer.append(altlabelString);
		}
		return outputBuffer.toString();
	}
	
	String propertyString(LisOfRDFDefinitions properties) {
		StringBuffer propertyString = new StringBuffer();
		propertyString.append("{");
		
		propertyString.append("creator: $creator");
		Set<String> keys = properties.keySet();
		for(String key : keys) {
			RDFPropertyDefinition definitionWithValue = properties.getDefinition(key);
			propertyString.append(", ");
			String altlabelString = definitionWithValue.getAltLabelString();
			propertyString.append(altlabelString);
			propertyString.append(": $");
			propertyString.append(altlabelString);
		}
		propertyString.append("}");
		return propertyString.toString();
	}
	
	}


