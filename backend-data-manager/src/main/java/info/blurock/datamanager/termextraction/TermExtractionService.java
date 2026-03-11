package info.blurock.datamanager.termextraction;

import com.google.cloud.discoveryengine.v1.SearchRequest;
import com.google.cloud.discoveryengine.v1.SearchResponse;
import com.google.cloud.discoveryengine.v1.SearchServiceClient;
import com.google.cloud.discoveryengine.v1.SearchServiceSettings;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.protobuf.Struct;
import info.blurock.datamanager.datastoreterms.DatastoreConstants;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service that uses the Discovery Engine built-in LLM summary (preamble) to:
 * 1. Find the best matching terms for a user prompt.
 * 2. Extract values from that prompt using the engine's own LLM — no external Gemini call needed.
 *
 * The preamble instructs the LLM (inside Discovery Engine) to return a JSON object
 * of {"term": "value"} pairs, which we then parse and combine with the search results.
 */
@Service
public class TermExtractionService {

    /**
     * The instruction preamble sent to the Discovery Engine LLM.
     * This is the key thing to tune for better extraction results.
     * The {query} placeholder is replaced by Discovery Engine automatically with the user's query.
     */
    private static final String PREAMBLE = """
        ROLE: You are a Data Extraction Assistant for scientific and thermodynamic data.
        TASK: You are provided with a USER QUERY and a list of DICTIONARY TERMS from the search results.
        Find the best matching term(s) from the results and extract the specific value associated with \
        each term from the user's query.
        
        RULES:
        1. KEY: Select the 'term' from the search results that matches the user's intent.
        2. VALUE: Extract the numeric or string value directly from the USER QUERY.
           If the user assigns a value (e.g. "temperature is 300"), extract just the number: 300.
           If no value is found in the query for a term, use null.
        3. OUTPUT: Return ONLY a valid JSON object. No markdown, no explanations.
        
        FORMAT: {"TermName": "extracted_value", "AnotherTerm": null}
        
        EXAMPLES:
        User Input: "The dataset task is called 'SimpleBenson'"
        Model Output: {"DataSetTaskName": "SimpleBenson"}
        
        User Input: "temperature is 300 K and enthalpy is -5.3"
        Model Output: {"TemperatureC": "300", "Enthalpy": "-5.3"}
        
        USER QUERY: {query}
        """;

    public List<ExtractedTerm> extractTerms(String prompt, String termSet, int maxResults) throws IOException {
        SearchServiceSettings settings = SearchServiceSettings.newBuilder().build();

        try (SearchServiceClient client = SearchServiceClient.create(settings)) {
            String servingConfig = String.format(
                "projects/%s/locations/%s/collections/%s/engines/%s/servingConfigs/%s",
                DatastoreConstants.PROJECT_ID,
                DatastoreConstants.LOCATION,
                DatastoreConstants.DATASTORE_COLLECTION,
                DatastoreConstants.AGENT_ID,
                DatastoreConstants.SERVING_CONFIG_ID
            );

            String filter = "metadata.datatype: ANY(\"" + termSet + "\")";
            System.out.println("TermExtraction: query='" + prompt + "', filter='" + filter + "'");

            SearchRequest request = SearchRequest.newBuilder()
                .setServingConfig(servingConfig)
                .setQuery(prompt)
                .setFilter(filter)
                .setPageSize(maxResults)
                .setContentSearchSpec(SearchRequest.ContentSearchSpec.newBuilder()
                    .setSummarySpec(SearchRequest.ContentSearchSpec.SummarySpec.newBuilder()
                        .setSummaryResultCount(maxResults)
                        .setModelPromptSpec(
                            SearchRequest.ContentSearchSpec.SummarySpec.ModelPromptSpec.newBuilder()
                                .setPreamble(PREAMBLE)
                                .build())
                        .build())
                    .build())
                .build();

            SearchResponse response = client.search(request).getPage().getResponse();

            // Step 1: collect terms found by search
            List<ExtractedTerm> foundTerms = new ArrayList<>();
            for (SearchResponse.SearchResult result : response.getResultsList()) {
                Struct struct = result.getDocument().getStructData();
                Map<String, com.google.protobuf.Value> fields = struct.getFieldsMap();

                String termId    = fields.containsKey("id")          ? fields.get("id").getStringValue()          : "";
                // 'term' field holds the full namespaced key (e.g. "dataset:Enthalpy")
                String termFull  = fields.containsKey("term")        ? fields.get("term").getStringValue()        : termId;
                String desc      = fields.containsKey("description") ? fields.get("description").getStringValue() : "";

                // Short name = strip namespace: "dataset:Enthalpy" -> "Enthalpy"
                String shortName = termFull.contains(":") ? termFull.substring(termFull.lastIndexOf(':') + 1) : termFull;

                // Capture all Firestore fields into a JsonObject (the full document)
                com.google.gson.JsonObject doc = new com.google.gson.JsonObject();
                for (Map.Entry<String, com.google.protobuf.Value> entry : fields.entrySet()) {
                    com.google.protobuf.Value v = entry.getValue();
                    switch (v.getKindCase()) {
                        case STRING_VALUE  -> doc.addProperty(entry.getKey(), v.getStringValue());
                        case NUMBER_VALUE  -> doc.addProperty(entry.getKey(), v.getNumberValue());
                        case BOOL_VALUE    -> doc.addProperty(entry.getKey(), v.getBoolValue());
                        default            -> doc.addProperty(entry.getKey(), v.toString());
                    }
                }

                // Capture relevance score from derivedStructData
                double score = 0.0;
                com.google.protobuf.Struct derived = result.getDocument().getDerivedStructData();
                if (derived.containsFields("clearbox_escorer_score")) {
                    score = derived.getFieldsOrThrow("clearbox_escorer_score").getNumberValue();
                }

                System.out.println("  Found term: " + shortName + " (namespaced: " + termFull + ", score: " + score + ")");
                foundTerms.add(new ExtractedTerm(shortName, termFull, "", desc, doc, score));
            }

            // Step 2: parse the LLM summary for values
            if (response.hasSummary()) {
                String rawJson = response.getSummary().getSummaryText();
                System.out.println("LLM Summary (raw): " + rawJson);

                // Clean markdown code fences if present
                String cleanJson = rawJson.replaceAll("```json|```", "").trim();
                System.out.println("LLM Summary (clean): " + cleanJson);

                foundTerms = enrichWithValues(foundTerms, cleanJson);

            } else {
                System.out.println("No LLM summary returned. Reasons: "
                    + response.getSummary().getSummarySkippedReasonsList());
            }

            // Sort: terms with values first (desc by score), then without (desc by score)
            foundTerms.sort(java.util.Comparator
                .<ExtractedTerm, Boolean>comparing(t -> t.getValue() == null || t.getValue().isBlank())
                .thenComparingDouble(t -> -t.getRelevanceScore())
            );

            return foundTerms;
        }
    }

    /**
     * Matches the LLM's JSON output back to the found terms and fills in values.
     * Case-insensitive matching so "TemperatureC" matches "temperaturec" from LLM.
     */
    private List<ExtractedTerm> enrichWithValues(List<ExtractedTerm> terms, String llmJson) {
        try {
            JsonObject json = JsonParser.parseString(llmJson).getAsJsonObject();
            // Build a lowercase map for case-insensitive matching.
            // Also strip namespace prefix from keys (e.g. "dataset:Enthalpy" -> "enthalpy")
            Map<String, String> valueMap = json.entrySet().stream()
                .filter(e -> !e.getValue().isJsonNull())
                .collect(Collectors.toMap(
                    e -> {
                        String key = e.getKey();
                        // Strip namespace: "dataset:ParameterSpecificationEnthalpy" -> "parameterspecificationenthalpy"
                        if (key.contains(":")) key = key.substring(key.lastIndexOf(':') + 1);
                        return key.toLowerCase();
                    },
                    e -> e.getValue().getAsString()
                ));

            List<ExtractedTerm> enriched = new ArrayList<>();
            for (ExtractedTerm t : terms) {
                String val = valueMap.get(t.getTerm().toLowerCase());
                enriched.add(new ExtractedTerm(t.getTerm(), t.getNamespacedTerm(), val != null ? val : "", t.getDescription(), t.getDocument(), t.getRelevanceScore()));
                System.out.println("  Enriched: " + t.getNamespacedTerm() + " -> " + val);
            }
            return enriched;
        } catch (Exception e) {
            System.err.println("Could not parse LLM JSON: " + e.getMessage() + " | raw: " + llmJson);
            return terms;
        }
    }
}
