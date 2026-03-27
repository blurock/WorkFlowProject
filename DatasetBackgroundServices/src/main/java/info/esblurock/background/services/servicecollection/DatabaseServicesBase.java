package info.esblurock.background.services.servicecollection;

import java.io.IOException;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import esblurock.info.neo4j.rdf.RDFQuestions;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

/**
 * Process data from the server
 * 
 * 
 * @author edwardblurock
 *
 */
public class DatabaseServicesBase {

	public static String service = "service";

	/**
	 * Process the POST
	 * 
	 * The required object within the JSON object is: service: This is the service
	 * to be performed. It should be a subclass (within the 'dataset:' of the
	 * DatabaseServicesBase in the ontology)
	 * 
	 * Using this, the service is found and processed. The required objects for the
	 * process should be found in the JSON object (as specified by the specific
	 * DatabaseServicesBase withinn the ontology.
	 * 
	 * @param body The body of the message
	 * @return The JSON object as return
	 * @throws IOException
	 */
	public static JsonObject process(JsonObject body) {
		String service = body.get(DatabaseServicesBase.service).getAsString();
		JsonObject response = new JsonObject();
		try {
			ServiceCollectionQueryOntology agentqo = ServiceCollectionQueryOntology.valueOf(service);
			response = agentqo.process(body);
		} catch (IllegalArgumentException ex1) {
			try {
				ServiceCollectionFirestoreCatalogAccess agentfire = ServiceCollectionFirestoreCatalogAccess
						.valueOf(service);
				response = agentfire.process(body);
			} catch (IllegalArgumentException ex2) {
				try {
					ServiceCollectionDatabaseCollectionSetAccess agentcoll = ServiceCollectionDatabaseCollectionSetAccess
							.valueOf(service);
					response = agentcoll.process(body);
				} catch (IllegalArgumentException ex3) {
					try {
						ServiceCollectionComputeThermodynamics computethermo = ServiceCollectionComputeThermodynamics
								.valueOf(service);
						response = computethermo.process(body);
					} catch (IllegalArgumentException ex4) {
						try {
							ServiceCollectionDatabaseAccess access = ServiceCollectionDatabaseAccess.valueOf(service);
							response = access.process(body);
						} catch (IllegalArgumentException ex5) {
							try {
								ServiceCollectionDatasetObjectsManipulation datasetmanipulation = ServiceCollectionDatasetObjectsManipulation
										.valueOf(service);
								response = datasetmanipulation.process(body);
							} catch (IllegalArgumentException ex6) {
								try {
									RDFQuestions rdefquestions = RDFQuestions
											.valueOf(service);
									response = rdefquestions.process(body); 
								} catch (IllegalArgumentException ex7) {
								response.addProperty(ClassLabelConstants.ServiceProcessSuccessful, false);
								response.addProperty(ClassLabelConstants.ServiceResponseMessage,
										"Service not available: '" + service + "'\n" + ex7.toString());
								response.add(ClassLabelConstants.SimpleCatalogObject, null);
							}
						}
					}
				}
			}
		}
		}
		return response;
	}

}
