package info.blurock.datamanager.datastoreterms;

import com.google.cloud.discoveryengine.v1.SearchRequest;
import com.google.cloud.discoveryengine.v1.SearchResponse;
import com.google.cloud.discoveryengine.v1.SearchServiceClient;
import com.google.cloud.discoveryengine.v1.SearchServiceSettings;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Comparator;

@Service
public class DictionarySearchService {

    public com.google.gson.JsonObject searchDictionaryTerm(String query, String datatype) throws IOException {
        SearchServiceSettings searchServiceSettings = SearchServiceSettings.newBuilder().build();
        com.google.gson.JsonObject responseObj = new com.google.gson.JsonObject();
        com.google.gson.JsonArray choicesArray = new com.google.gson.JsonArray();

        try (SearchServiceClient searchServiceClient = SearchServiceClient.create(searchServiceSettings)) {

            String servingConfigS = String.format(
                    "projects/%s/locations/%s/collections/%s/engines/%s/servingConfigs/%s",
                    DatastoreConstants.PROJECT_ID,
                    DatastoreConstants.LOCATION,
                    DatastoreConstants.DATASTORE_COLLECTION,
                    DatastoreConstants.AGENT_ID,
                    DatastoreConstants.SERVING_CONFIG_ID);

            String filterExpression = "metadata.datatype: ANY(\"" + datatype + "\") ";

            SearchRequest request = SearchRequest.newBuilder()
                    .setServingConfig(servingConfigS)
                    .setQuery(query)
                    .setFilter(filterExpression)
                    .setPageSize(6)
                    .build();

            System.out.println("Processing search query: " + query + " with filter: " + filterExpression);

            SearchServiceClient.SearchPagedResponse response = searchServiceClient.search(request);

            List<com.google.gson.JsonObject> allResults = new ArrayList<>();
            for (SearchResponse.SearchResult result : response.iterateAll()) {
                Map<String, com.google.protobuf.Value> fields = result.getDocument().getStructData().getFieldsMap();
                String term = fields.containsKey("term") ? fields.get("term").getStringValue() : 
                             (fields.containsKey("id") ? fields.get("id").getStringValue() : "Unknown");
                
                double score = 0.0;
                com.google.protobuf.Struct derived = result.getDocument().getDerivedStructData();
                if (derived.containsFields("clearbox_escorer_score")) {
                    score = derived.getFieldsOrThrow("clearbox_escorer_score").getNumberValue();
                }

                com.google.gson.JsonObject resultEntry = new com.google.gson.JsonObject();
                resultEntry.addProperty("term", term);
                resultEntry.addProperty("score", score);
                allResults.add(resultEntry);
            }

            // Explicitly sort by score descending
            allResults.sort((a, b) -> Double.compare(b.get("score").getAsDouble(), a.get("score").getAsDouble()));

            boolean first = true;
            for (com.google.gson.JsonObject resultEntry : allResults) {
                if (first) {
                    responseObj.add("topResult", resultEntry);
                    // Legacy support for searchResult string
                    responseObj.addProperty("searchResult", resultEntry.get("term").getAsString());
                    first = false;
                } else {
                    choicesArray.add(resultEntry);
                }
            }
            
            if (first) {
                responseObj.addProperty("searchResult", "No matching term found.");
            }
            responseObj.add("choices", choicesArray);
            return responseObj;
        }
    }

    /**
     * Fetches all terms for a given datatype from Firestore.
     */
    public DictionaryTermSet getTermsByDatatype(String datatype) {
        DictionaryTermSet termSet = new DictionaryTermSet();
        try {
            com.google.cloud.firestore.Firestore db = com.google.firebase.cloud.FirestoreClient.getFirestore();
            com.google.cloud.firestore.CollectionReference collection = db.collection(DatastoreConstants.DATASTORE_TERMS);
            
            // metadata.datatype is an array, so we use array-contains
            com.google.api.core.ApiFuture<com.google.cloud.firestore.QuerySnapshot> query = collection.whereArrayContains("metadata.datatype", datatype).get();
            
            for (com.google.cloud.firestore.QueryDocumentSnapshot document : query.get().getDocuments()) {
                String id = document.getString("id");
                String term = document.getString("term");
                String description = document.getString("description");
                Map<String, Object> metadata = (Map<String, Object>) document.get("metadata");
                
                DictionaryTerm dt = new DictionaryTerm(id, term, description, (java.util.List<String>) metadata.get("datatype"));
                termSet.addTerm(dt);
            }
        } catch (Exception e) {
            System.err.println("Error fetching terms by datatype: " + e.getMessage());
            e.printStackTrace();
        }
        return termSet;
    }
}
