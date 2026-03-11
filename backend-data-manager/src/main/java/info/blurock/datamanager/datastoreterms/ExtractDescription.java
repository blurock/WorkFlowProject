package info.blurock.datamanager.datastoreterms;

import com.google.cloud.discoveryengine.v1.*;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class ExtractDescription {

    public static class DescriptionResult {
        private String description;
        private String title;
        private String keyword;

        public DescriptionResult(String description, String title, String keyword) {
            this.description = description;
            this.title = title;
            this.keyword = keyword;
        }

        public String getDescription() { return description; }
        public String getTitle() { return title; }
        public String getKeyword() { return keyword; }

        @Override
        public String toString() {
            return "DescriptionResult{" +
                    "description='" + description + '\'' +
                    ", title='" + title + '\'' +
                    ", keyword='" + keyword + '\'' +
                    '}';
        }
    }

    private static final String PREAMBLE = """
            ROLE: You are a Content Summarization Agent.
            TASK: Analyze the USER QUERY and provide a concise title and a single keyword.
            
            RULES:
            1. TITLE: Create a brief, descriptive title that summarizes the main topic of the query.
            2. KEYWORD: Provide a single keyword that summarizes the text. It can be a concatenation of up to four words (e.g., 'HeatCapacityCalculation').
            3. OUTPUT: Return ONLY a valid JSON object. No markdown, no explanations.
            
            FORMAT: {"title": "Summary Title", "keyword": "KeyWord"}
            
            USER QUERY: {query}
            """;

    /**
     * Extracts a title and keyword summary for the given prompt.
     * 
     * @param prompt The full text description.
     * @param datatype Filter for the agent context.
     * @return A result containing the description, title, and summarized keyword.
     */
    public DescriptionResult extract(String prompt, String datatype) throws IOException {
        SearchServiceSettings settings = SearchServiceSettings.newBuilder().build();
        String title = "Summary of " + (prompt.length() > 30 ? prompt.substring(0, 27) + "..." : prompt);
        String keyword = datatype;

        try (SearchServiceClient client = SearchServiceClient.create(settings)) {
            String servingConfig = String.format(
                "projects/%s/locations/%s/collections/%s/engines/%s/servingConfigs/%s",
                DatastoreConstants.PROJECT_ID,
                DatastoreConstants.LOCATION,
                DatastoreConstants.DATASTORE_COLLECTION,
                DatastoreConstants.AGENT_ID,
                DatastoreConstants.SERVING_CONFIG_ID
            );

            // We use the provided datatype term set to provide relevant dictionary context for the LLM.
            // This assists the LLM in understanding the specific ontology domain.
            String searchQuery = prompt;
            String filter = "metadata.datatype: ANY(\"" + datatype + "\")";

            SearchRequest request = SearchRequest.newBuilder()
                .setServingConfig(servingConfig)
                .setQuery(searchQuery)
                .setFilter(filter)
                .setPageSize(10)
                .setContentSearchSpec(SearchRequest.ContentSearchSpec.newBuilder()
                    .setSummarySpec(SearchRequest.ContentSearchSpec.SummarySpec.newBuilder()
                        .setSummaryResultCount(5)
                        .setModelPromptSpec(
                            SearchRequest.ContentSearchSpec.SummarySpec.ModelPromptSpec.newBuilder()
                                .setPreamble(PREAMBLE)
                                .build())
                        .build())
                    .build())
                .build();

            SearchResponse response = client.search(request).getPage().getResponse();
            System.out.println("ExtractDescription found " + response.getResultsCount() + " documents for context.");

            if (response.hasSummary() && response.getSummary().getSummaryText() != null && !response.getSummary().getSummaryText().isEmpty()) {
                String rawJson = response.getSummary().getSummaryText();
                String cleanJson = rawJson.replaceAll("```json|```", "").trim();
                System.out.println("ExtractDescription Agent JSON: " + cleanJson);
                
                try {
                    // LLM might return explanatory text before or after JSON if not careful, 
                    // though we asked for ONLY JSON. We attempt to extract the JSON block.
                    int start = cleanJson.indexOf("{");
                    int end = cleanJson.lastIndexOf("}");
                    if (start >= 0 && end > start) {
                        cleanJson = cleanJson.substring(start, end + 1);
                    }
                    
                    JsonObject json = JsonParser.parseString(cleanJson).getAsJsonObject();
                    if (json.has("title")) title = json.get("title").getAsString();
                    if (json.has("keyword")) keyword = json.get("keyword").getAsString();
                } catch (Exception e) {
                    System.err.println("Error parsing summarization agent output: " + e.getMessage() + " | Raw JSON was: " + cleanJson);
                }
            } else {
                System.out.println("No summary returned for ExtractDescription. Summary result: " + response.getSummary());
            }
        }

        return new DescriptionResult(prompt, title, keyword);
    }
}
