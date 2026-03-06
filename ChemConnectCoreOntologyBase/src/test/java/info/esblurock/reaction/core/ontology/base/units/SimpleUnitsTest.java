package info.esblurock.reaction.core.ontology.base.units;

import static org.junit.Assert.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.jena.ontology.OntModel;
import org.apache.jena.query.Query;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.ResultSet;
import org.apache.jena.query.ResultSetFactory;
import org.apache.jena.rdf.model.RDFNode;
import org.junit.Test;

import info.esblurock.reaction.core.ontology.base.OntologyBase;

public class SimpleUnitsTest {

	@Test
	public void test() {
		String queryS = 
				"SELECT ?qk ?qku ?qkl\n"
				+ "WHERE {\n"
				+ "    BIND (quantitykind:MolarEnergy AS ?arg1) .\n"
				+ "    ?qk rdf:type qudt:QuantityKind .\n"
				+ "    FILTER (?qk = ?arg1) .\n"
				+ "    ?qku qudt:hasQuantityKind ?qk .\n"
				+ "   ?qku a qudt:Unit .\n"
				+ "   ?qku rdfs:label ?qkl .\n"
				+ "} ORDER BY ?qku";
		ResultSet results = OntologyBase.datasetQueryBase(queryS);
		List<Map<String, RDFNode>> map = OntologyBase.resultSetToMap(results);
		ArrayList<Map<String, String>> lst = OntologyBase.resultmapToStrings(map);
		
		for(Map<String, String> r: lst) {
			System.out.println("-------------------------------");
			System.out.println(r);
			System.out.println("-------------------------------");
		}
		
	}

}
