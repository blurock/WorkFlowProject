package info.blurock.datamanager.datastoreterms;

import com.google.cloud.discoveryengine.v1.*;
import com.google.gson.*;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FillInOntologyObject {

    public static class FillInResult {
        private Map<String, String> assignedProperties;
        private List<String> unassignedProperties;

        public FillInResult(Map<String, String> assignedProperties, List<String> unassignedProperties) {
            this.assignedProperties = assignedProperties;
            this.unassignedProperties = unassignedProperties;
        }

        public Map<String, String> getAssignedProperties() {
            return assignedProperties;
        }

        public List<String> getUnassignedProperties() {
            return unassignedProperties;
        }

        @Override
        public String toString() {
            return "FillInResult{" +
                    "assigned=" + assignedProperties +
                    ", unassigned=" + unassignedProperties +
                    '}';
        }
    }

    /**
     * Fills in properties for an ontology object based on a user prompt.
     * 
     * @param prompt User text containing values.
     * @param classname The ontology class to fill (e.g. "dataset:ActivityRepositoryInitialReadLocalFile").
     * @param datatype The datastore type filter.
     * @return A result containing assigned pairs and unassigned property names.
     */
    public FillInResult fillInProperties(String prompt, String classname, String datatype) throws IOException {
        // 1. Get the list of simple property classnames
        List<String> expectedProperties = DataTermsUtilities.getSimpleProperties(classname);
        System.out.println("FillInOntologyObject: Expected properties for " + classname + ": " + expectedProperties);

        // 2. Prepare the prompt for the agent
        String propertyContext = String.join(", ", expectedProperties);
        String preamble = String.format("""
            ROLE: You are an Extraction Agent.
            CONTEXT: You are looking for values for the following ontology classnames: [%s]
            TASK: Analyze the USER QUERY and extract values for these specific classnames.
            
            RULES:
            1. Only extract values for classnames in the CONTEXT list.
            2. If a value is found in the USER QUERY that corresponds to an ontology class (e.g. a title for 'dcterms:title'), extract it.
            3. OUTPUT: Return a JSON object where the key is the namespaced classname and the value is the extracted text or number.
            
            FORMAT: {"classname": "value", "another:classname": "value"}
            
            USER QUERY: {query}
            """, propertyContext);

        // 3. Call Discovery Engine (Agent)
        SearchServiceSettings settings = SearchServiceSettings.newBuilder().build();
        Map<String, String> assigned = new HashMap<>();

        try (SearchServiceClient client = SearchServiceClient.create(settings)) {
            String servingConfig = String.format(
                "projects/%s/locations/%s/collections/%s/engines/%s/servingConfigs/%s",
                DatastoreConstants.PROJECT_ID,
                DatastoreConstants.LOCATION,
                DatastoreConstants.DATASTORE_COLLECTION,
                DatastoreConstants.AGENT_ID,
                DatastoreConstants.SERVING_CONFIG_ID
            );

            // We filter by datatype to provide relevant dictionary terms as context for the LLM
            String filter = "metadata.datatype: ANY(\"" + datatype + "\")";

            SearchRequest request = SearchRequest.newBuilder()
                .setServingConfig(servingConfig)
                .setQuery(prompt)
                .setFilter(filter)
                .setPageSize(10)
                .setContentSearchSpec(SearchRequest.ContentSearchSpec.newBuilder()
                    .setSummarySpec(SearchRequest.ContentSearchSpec.SummarySpec.newBuilder()
                        .setSummaryResultCount(5)
                        .setModelPromptSpec(
                            SearchRequest.ContentSearchSpec.SummarySpec.ModelPromptSpec.newBuilder()
                                .setPreamble(preamble)
                                .build())
                        .build())
                    .build())
                .build();

            SearchResponse response = client.search(request).getPage().getResponse();

            if (response.hasSummary()) {
                String rawJson = response.getSummary().getSummaryText();
                String cleanJson = rawJson.replaceAll("```json|```", "").trim();
                System.out.println("Agent Extraction JSON: " + cleanJson);
                
                try {
                    JsonObject json = JsonParser.parseString(cleanJson).getAsJsonObject();
                    for (Map.Entry<String, JsonElement> entry : json.entrySet()) {
                        if (!entry.getValue().isJsonNull()) {
                            assigned.put(entry.getKey(), entry.getValue().getAsString());
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error parsing agent output: " + e.getMessage());
                }
            }
        }

        // 4. Determine which properties were not assigned
        List<String> unassigned = expectedProperties.stream()
                .filter(prop -> !assigned.containsKey(prop))
                .collect(Collectors.toList());

        return new FillInResult(assigned, unassigned);
    }
}
