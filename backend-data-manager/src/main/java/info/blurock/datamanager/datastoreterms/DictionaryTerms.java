package info.blurock.datamanager.datastoreterms;

import java.util.HashMap;
import java.util.Map;

import com.google.gson.JsonObject;

public class DictionaryTerms {
    public class DictionaryTerm {
    private String id;          // Unique identifier
    private String term;        // Your "Label"
    private String description; // The "Natural Language Description"
    private Map<String, Object> metadata; // Extra context (Category, Source, etc.)

    public DictionaryTerm() {
		this.id = "";
		this.term = "";
		this.description = "";
		this.metadata = new HashMap<String, Object>();
	}
    
    public DictionaryTerm(String id, String term, String description, Map<String, Object> metadata) {
    	this.id = id;
    	this.term = term;
    	this.description = description;
    	this.metadata = metadata != null ? metadata : new HashMap<String, Object>();
    }
    
    public DictionaryTerm(String id, String term, String description) {
    	this.id = id;
    	this.term = term;
    	this.description = description;
    	this.metadata = new HashMap<String, Object>();
    }
    
	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getTerm() {
		return term;
	}

	public void setTerm(String term) {
		this.term = term;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Map<String, Object> getMetadata() {
		return metadata;
	}

	public void setMetadata(Map<String, Object> metadata) {
		this.metadata = metadata;
	}

	public void addMetadata(String key, Object value) {
		this.metadata.put(key, value);
	}

	public Object getMetadataValue(String key) {
		return this.metadata.get(key);
	}

	public String toString() {
		return "DictionaryTerm{id='" + id + "', term='" + term + "', description='" + description + "', metadata="
				+ metadata + "}";
	}
	
	public JsonObject toJsonObject() {
		JsonObject json = new JsonObject();
        json.addProperty("id", this.id);
        json.addProperty("term", this.term);
        json.addProperty("description", this.description);
        JsonObject metadataJson = new JsonObject();
        for (Map.Entry<String, Object> entry : this.metadata.entrySet()) {
            metadataJson.addProperty(entry.getKey(), entry.getValue().toString());
        }
        json.add("metadata", metadataJson);
        return json;	
	}
	
	public Map<String, Object> toMap() {
		Map<String, Object> map = new HashMap<>();
		map.put("id", this.id);
		map.put("term", this.term);
		map.put("description", this.description);
		map.put("metadata", this.metadata);
		return map;
		
	}

}