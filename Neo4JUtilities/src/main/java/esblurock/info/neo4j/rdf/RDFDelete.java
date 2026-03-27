package esblurock.info.neo4j.rdf;

import java.util.Map;

import org.dom4j.Document;
import org.dom4j.Element;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.Transaction;
import org.neo4j.driver.summary.ResultSummary;
import org.neo4j.driver.summary.SummaryCounters;

import com.google.gson.JsonObject;

import esblurock.info.neo4j.utilities.Neo4JInitialization;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;

public class RDFDelete {
	public static JsonObject deleteRDFsWithTransactionID(String transactionid) {
        String title = "Delete RDF with Transaction ID " + transactionid;
        Document docmessage = MessageConstructor.startDocument(title);
        Element body = MessageConstructor.isolateBody(docmessage);
        body.addElement("h3").addText(title);
		
		JsonObject response = null;
		String altlabel = DatasetOntologyParseBase.getAltLabelFromAnnotation("dataset:TransactionIDinRDF");
		String cypherqueryString = "MATCH (n {" + altlabel + ": \"" + transactionid + "\"}) DETACH DELETE n";
		body.addElement("pre").addText("Query: " + cypherqueryString);
		try (Session session = Neo4JInitialization.getDriver().session()) {
			Transaction transaction = session.beginTransaction();
			Result result = transaction.run(cypherqueryString);
			ResultSummary summary = result.consume();
			SummaryCounters counters = summary.counters();
			int nodesDeleted = counters.nodesDeleted();
			int relationshipsDeleted = counters.relationshipsDeleted();
			body.addElement("pre").addText("Nodes deleted: " + nodesDeleted);
			body.addElement("pre").addText("Relationships deleted: " + relationshipsDeleted);
            transaction.commit();
			String mtitle = "Deletion successful";
			response = StandardResponse.standardServiceResponse(docmessage, mtitle, null);
	} catch (Exception e) {
		String mtitle = "Deletion failed: " + e.getMessage();
		body.addElement("pre").addText(mtitle);		
		response = StandardResponse.standardServiceResponse(docmessage, mtitle, null);
    }
		return response;
	}
}
