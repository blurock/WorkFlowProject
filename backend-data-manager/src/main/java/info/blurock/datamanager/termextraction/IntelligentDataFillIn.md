GOAL: 
To create documentation for the Value and Term Extraction feature, specifically the TermExtractionService and ExtractedTerm classes.
The documentation should be on three levels:
1. A high level overview of what the feature does (so a non-technical person can understand it)
2. A detailed explanation of the logic (code highlights and prompt engineering)
3. A detailed highly technical explanation of how the service works (so a software engineer could implement it from scratch)

General Information:
Whenever a term or class or technical term is mentioned, include a link to documentation of that term or class or technical term.
Important: there should be ALOT of links to documentation at all levels of this document.

TOP of the page:
Include a graphic at the top of the page showing the flow of data from a raw scientific prompt to a structured set of extracted terms and values.

Low Level Overview:
The user provides a natural language description containing scientific data (e.g., "The temperature is 300K"). The "Value and Term Extraction" agent automatically identifies which scientific parameters are being described and extracts their values. 
Explain the concept of "Data Grounding" — why we search the dictionary first before asking the AI to extract values.

Higher Level Overview:
The focus is on the multi-step RAG process handled internally by Discovery Engine.
1. The Prompt: Explain the `PREAMBLE` and why it includes examples for the LLM.
2. The Integration: Explain how the search results (Dictionary Terms) are provided to the LLM as context for extraction.
3. The Match: Explain the `enrichWithValues` logic — how the JSON output from the AI is mapped back to physical Data Store documents.

Technical Details: (a link to an additional page at the bottom of the Object Fill-In page)
Include the entire class and explain each method in detail. 
1. The JAVA class `TermExtractionService`
2. The `ExtractedTerm` data model
3. Detailed notes on the `SearchRequest` configuration:
   - `setContentSearchSpec`
   - `setSummarySpec`
   - `setSummaryResultCount`
   - `setModelPromptSpec` (The `PREAMBLE`)
4. Parsing and Enrichment:
   - How `SearchPagedResponse` results are converted to `ExtractedTerm` objects.
   - The cleaning logic: `replaceAll("` + "``json|`" + "``", \"\").trim()`.
   - The case-insensitive mapping in `enrichWithValues`.
5. Error Handling:
   - What happens when `response.hasSummary()` is false.
   - Handling LLM hallucinations or malformed JSON.

## Refinement: Building Block Architecture
Add a section contrasting RAG, Description Extraction, and Value and Term Extraction.
- **RAG**: Creating the Context (Vector Search & Filters).
- **Description Extraction**: Using Generative AI (Narrative Preambles).
- **Value and Term Extraction**: Grounded Extraction (Strict JSON Preamble & Dynamic Join).

## Tasks: Value and Term Extraction Documentation Refinement
- [x] Research existing code and requirements
- [x] Create Documentation Plan (IntelligentDataFillIn.md)
- [x] Implement Web Documentation
- [x] Documentation Refinement
    - [x] Add RAG vs. Extraction vs. Fill-In comparison
    - [x] Re-deploy and verify
- [x] Integration and Deployment
- [x] Final Verification
- [x] RAG Documentation Improvement
    - [x] Generate RAG architecture graphic
    - [x] Update Overview Page with RAG image
    - [x] Re-deploy and verify

## Walkthrough of Documentation Generation
This documentation was programmatically generated following these steps:
1. **Source Analysis**: Analyzed TermExtractionService.java and ExtractedTerm.java to extract core logic and data models.
2. **Architecture Mapping**: Defined the "Building Block" relationship between RAG, Extraction, and Fill-In.
3. **Visual Flow Creation**: Used autonomous tools to generate a high-tech diagram of the "Grounded Extraction" process.
4. **HTML/CSS Development**: Created object-fillin.html and object-fillin-technical.html with responsive layouts and technical deep-dives.
5. **Asset Migration**: Migrated generated diagrams to public/assets/ for production reliability.
6. **Vite & Firebase Integration**: Added entry points to vite.config.js and deployed to Firebase Hosting.
