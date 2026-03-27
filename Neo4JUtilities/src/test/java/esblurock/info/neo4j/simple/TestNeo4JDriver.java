package esblurock.info.neo4j.simple;

import static org.junit.Assert.*;

import java.util.Map;

import org.junit.Test;
import org.neo4j.driver.AuthToken;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.Values;
import org.neo4j.driver.exceptions.NoSuchRecordException;
import org.neo4j.driver.summary.ResultSummary;

import esblurock.info.neo4j.utilities.Neo4JInitialization;

public class TestNeo4JDriver {

	@Test
	public void openDriver() {
		try {

			/*
			 * AuthToken auth = AuthTokens.basic("neo4j",
			 * "dIF3WXZEPVljjlFrjAtSb9f9r_Rv55QaWDNNUcjOsGw");
			 * Driver driver = GraphDatabase.driver("neo4j+s://f722f1a0.databases.neo4j.io",
			 * auth);
			 * 
			 * driver.verifyConnectivity();
			 */
			// Driver driver = Neo4JInitialization.initDriver();
		} catch (Exception ex) {
			ex.printStackTrace();
		}

	}

	@Test
	public void testCreateRelationship() {
		try {
			Driver driver = Neo4JInitialization.getDriver();

			String cypherQuery = """
					CREATE (charlie:Person:Actor {name: 'Charlie Sheen'})
					       -[:ACTED_IN {role: 'Bud Fox'}]->
					       (wallStreet:Movie {title: 'Wall Street'})
					       <-[:DIRECTED]-
					       (oliver:Person:Director {name: 'Oliver Stone'})
					""";

			try (Session session = driver.session()) {
				// Execute the write query within a managed transaction
				session.executeWrite(transaction -> {
					Result result = transaction.run(cypherQuery);
					// You can optionally consume the result or get the summary
					ResultSummary summary = result.consume();
					System.out.println("Cypher execution summary: ");
					System.out.println("  Query Type: " + summary.queryType());
					System.out.println("  Nodes Created: " + summary.counters().nodesCreated());
					System.out.println("  Relationships Created: " + summary.counters().relationshipsCreated());
					System.out.println("  Properties Set: " + summary.counters().propertiesSet());
					return summary; // Return value for executeWrite lambda (can be anything)
				});

				System.out.println("Cypher query executed successfully!");

			} catch (NoSuchRecordException e) {
				// throw new ValidationException(String.format("Couldn't create a favorite
				// relationship for User %s and Movie %s", userId, movieId),
				// Map.of("movie",movieId, "user",userId));
			}
		} catch (Exception ex) {
			ex.printStackTrace();
		}
	}
}
