GOAL: 
To create documentation for the 'Fill In Catalog Object' feature, specifically the FillInOntologyObject class.
The documentation should be on three levels:
1. A high level overview (Non-Technical): Explaining how the system helps fill out complex scientific forms from natural language.
2. A detailed logic overview (Mid-Level): Explaining the dynamic preamble generation and the list of "expected properties".
3. A detailed technical deep-dive (Software Engineer): Complete class breakdown, API usage, and property matching logic.

TOP of the page:
Include a graphic showing an empty "Catalog Object" (like a form) being filled in by an AI agent that is processing a scientist's description.

Low Level Overview:
The user has an existing object type in mind (e.g., a "File Data Source"). Instead of manually typing every field, they describe the object. The system knows the schema of that object and uses AI to "fill in the blanks".

Higher Level Overview:
The focus is on the "Contract of Properties".
1. Dynamic Context: Explain how the system first queries the ontology to find all valid properties for a class.
2. The Targeted Preamble: Explain why we pass this specific list of classnames to the LLM to restrict its extraction focus.
3. The Result Map: Explain the `FillInResult` — how we clearly show what was assigned and what remains empty.

Technical Details: (a link to an additional page at the bottom of the 'Catalog Fill-In' page)
Include the entire class and explain:
1. The static inner class `FillInResult`.
2. The `fillInProperties` orchestration method.
3. Dynamic Preamble construction using `propertyContext`.
4. Discovery Engine configuration (Grounding and Filtering).
5. Post-extraction filtering: Using Java Streams to identify unassigned properties.
