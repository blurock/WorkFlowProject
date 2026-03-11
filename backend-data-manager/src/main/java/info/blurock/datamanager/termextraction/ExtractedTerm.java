package info.blurock.datamanager.termextraction;

import com.google.gson.JsonObject;

/**
 * Represents a term extracted from a prompt, with its value and the full Firestore document.
 */
public class ExtractedTerm {
    private String term;        // Short name (e.g. "ParameterSpecificationEnthalpy")
    private String namespacedTerm; // Full identifier (e.g. "dataset:ParameterSpecificationEnthalpy")
    private String value;
    private String description;
    private JsonObject document;  // Full Firestore document fields
    private double relevanceScore; // Discovery Engine clearbox relevance score

    public ExtractedTerm(String term, String namespacedTerm, String value, String description, JsonObject document, double relevanceScore) {
        this.term = term;
        this.namespacedTerm = namespacedTerm;
        this.value = value;
        this.description = description;
        this.document = document;
        this.relevanceScore = relevanceScore;
    }

    public String getTerm() { return term; }
    public String getNamespacedTerm() { return namespacedTerm; }
    public String getValue() { return value; }
    public String getDescription() { return description; }
    public JsonObject getDocument() { return document; }
    public double getRelevanceScore() { return relevanceScore; }

    public void setValue(String value) { this.value = value; }

    public JsonObject toJsonObject() {
        JsonObject obj = new JsonObject();
        obj.addProperty("term", term);
        obj.addProperty("namespacedTerm", namespacedTerm != null ? namespacedTerm : term);
        obj.addProperty("value", value != null ? value : "");
        obj.addProperty("description", description != null ? description : "");
        obj.addProperty("relevanceScore", relevanceScore);
        // Embed the full Firestore document
        if (document != null) {
            obj.add("document", document);
        }
        return obj;
    }
}
