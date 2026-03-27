package esblurock.info.neo4j;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import esblurock.info.neo4j.rdf.QueryRDF;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestQueryRDF {

	@Test
	public void test() {
		String labelString = ClassLabelConstants.PersonFullName;
		
		String ownerString = "Administration";
		try {
			String propertyString = "Edward Blurock";
			String otitle = "Query " + labelString + " with property " + propertyString;
			JsonObject oresponse = QueryRDF.retreiveSubjectNodeWithProperty(labelString, propertyString,ownerString, otitle);
			JsonObjectUtilities.printResponse(oresponse);
			/*
			String relationString = "dataset:RDFHttpAddress";
			String rtitle = "Query Relationship" + relationString;
			JsonObject rresponse = QueryRDF.retreiveSubjectObjectWithRelation(relationString,ownerString, rtitle);
			JsonObjectUtilities.printResponse(rresponse);
			*/
			
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		
	}

}
