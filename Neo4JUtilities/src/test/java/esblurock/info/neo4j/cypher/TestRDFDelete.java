package esblurock.info.neo4j.cypher;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import esblurock.info.neo4j.rdf.RDFDelete;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestRDFDelete {

	@Test
	public void test() {
		String transactionidString = "transactionid";
		try {
            JsonObject response = RDFDelete.deleteRDFsWithTransactionID(transactionidString);
            JsonObjectUtilities.printResponse(response);
        } catch (Exception e) {
            e.printStackTrace();
        }
	}
}
