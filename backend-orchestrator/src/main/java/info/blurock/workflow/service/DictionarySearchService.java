package info.blurock.workflow.service;

import com.google.cloud.discoveryengine.v1.SearchRequest;
import com.google.cloud.discoveryengine.v1.SearchResponse;
import com.google.cloud.discoveryengine.v1.SearchServiceClient;
import com.google.cloud.discoveryengine.v1.SearchServiceSettings;
import com.google.cloud.discoveryengine.v1.ServingConfigName;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Map;

@Service
public class DictionarySearchService {

    private final String projectId = "blurock-database";
    private final String location = "global";
    private final String agentId = "analyzeterm_1772469548697";
    private final String servingConfigId = "default_search";

    public String searchDictionaryTerm(String query, String datatype) throws IOException {
        SearchServiceSettings searchServiceSettings = SearchServiceSettings.newBuilder().build();

        try (SearchServiceClient searchServiceClient = SearchServiceClient.create(searchServiceSettings)) {

            String servingConfigS = String.format(
                    "projects/%s/locations/global/collections/default_collection/engines/%s/servingConfigs/default_search",
                    projectId,
                    agentId);

            // Filter by metadata.datatype
            String filterExpression = "metadata.datatype: ANY(\"" + datatype + "\") ";

            SearchRequest request = SearchRequest.newBuilder()
                    .setServingConfig(servingConfigS)
                    .setQuery(query)
                    .setFilter(filterExpression)
                    // Remove filter for now to ensure the query works, can add back using custom
                    // schema fields if needed
                    .setPageSize(1) // We only want the best match
                    .build();

            // Perform the search
            SearchServiceClient.SearchPagedResponse response = searchServiceClient.search(request);

            // Extract the top match if available
            for (SearchResponse.SearchResult result : response.iterateAll()) {
                // The structure of the document depends on the schema provided.
                // Assuming it returns structData where 'term' is a key.
                Map<String, com.google.protobuf.Value> fields = result.getDocument().getStructData().getFieldsMap();
                if (fields.containsKey("term")) {
                    return fields.get("term").getStringValue();
                }
            }
            return "No matching term found.";
        }
    }
}
