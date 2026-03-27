GOAL: 
To create documentation for the DescriptionExtraction class.
The documentation should be on three levels:
1. A high level overview of what the class does (so a non-technical person can understand it)
2. A detailed explanation of the code (code highlights and explanations)
3. A detailed highly technical explanation of how the class works (so a software engineer could implement it from scratch)

General Information:
Whenever a term or class or technical term is mentioned, include a link to documentation of that term or class or technical term.
Important: there should be ALOT of links to documentation at all levels of this document.

TOP of the page:
Include a graphic at the top of the page showing the flow of data from prompt to the AI agent to finally the user. 

Low Level Overview:
the prompt is a natural language description. the agent is given the prompt and extracts the title and keyword. Include a general description of the use of agents and prompt engineering in general. What is an agent? What is prompt engineering? Give some general references to documentation on these topics. (google links)

Higher Level Overview:
The main emphais here is the prompt engineering. Include the entire prompt and explain how it is constructed and its parts. Be detailed in this explanation and explain good prompt engineering practices. give also a google link documenting prompt engineering practices.

Technical Details: (a link to an additional page at the botton of the DescriptionExtraction page)
Include the entire class and explain each method in detail. 
1. The JAVA class DescriptionExtraction
2. Detailed notes on the configuration: 
String servingConfig = String.format(
                "projects/%s/locations/%s/collections/%s/engines/%s/servingConfigs/%s",
                DatastoreConstants.PROJECT_ID,
                DatastoreConstants.LOCATION,
                DatastoreConstants.DATASTORE_COLLECTION,
                DatastoreConstants.AGENT_ID,
                DatastoreConstants.SERVING_CONFIG_ID
            );
What are we pointing to? and why? Why do we need a data store collection? the role of project and location. Make another section about the agent ID, why we need it and how to set it up.
3. Detailed notes on the prompt:
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

4. Detailed notes on the SearchRequest class:
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
4.1.setContentSearchSpec
4.2 setSummarySpec
4.3 setSummaryResultCount
4.4 setModelPromptSpec
4.5 setPreamble
4.6 setQuery
4.7 setFilter
4.8 setPageSize

5. Detailed notes on the SearchResponse class:
    5.1 SearchResponse response = client.search(request).getPage().getResponse();
    5.2 Explanation of the summary field in the SearchResponse class.
    5.3 String rawJson = response.getSummary().getSummaryText();
    5.4 String cleanJson = rawJson.replaceAll("```json|```", "").trim();
    5.5 Include explanation of the summary text as opposed to the structured data in the SearchResponse class. (link to google documentation)


## Walkthrough of Documentation Generation

This section describes how the documentation pages were programmatically generated from the requirements above.

### 1. Content Architecture
The documentation was split into a two-page structure to satisfy the three-level requirement:
- **Overview Page (description-extraction.html)**: Addresses **Level 1** (Non-technical) and **Level 2** (Detailed prompt explanation). It focuses on the "What" and "Why".
- **Technical Page (description-extraction-technical.html)**: Addresses **Level 3** (Software Engineering details). It focuses on the "How" and "Implementation".

### 2. Visual Asset Generation
A dedicated tool (generate_image) was used to create a high-fidelity visual representation of the data flow. The prompt specified a "glassmorphism" aesthetic with blue/purple accents to match the project's modern design system.

### 3. Technical Implementation Steps
1. **Data Gathering**: The Java source code (ExtractDescription.java) and configuration constants (DatastoreConstants.java) were analyzed to extract code snippets.
2. **External Research**: Google Cloud documentation was searched for every class and technical term (SearchRequest, SummarySpec, ServingConfig) to provide deep linking.
3. **HTML/CSS Assembly**: Modern CSS layouts (Grids, Flexbox) were designed for the "Resource Path Breakdown" tables and code comparison blocks.
4. **Integration**: The new entry points were added to the Vite build configuration (vite.config.js).
5. **Deployment**: The site was built and synchronized with Firebase Hosting, providing a live, publicly accessible URL.

### 4. Maintenance
Any updates to the ExtractDescription.java preamble or API logic should be reflected in both the technical page and the overview page to ensure the documentation remains the "Source of Truth" for the system.
