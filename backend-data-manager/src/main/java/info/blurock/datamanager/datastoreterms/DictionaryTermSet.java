package info.blurock.datamanager.datastoreterms;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.google.gson.JsonArray;

public class DictionaryTermSet {

	private java.util.Map<String, DictionaryTerm> termMap;
	
	public DictionaryTermSet() {
		this.termMap = new java.util.LinkedHashMap<>();
	}
	
	public List<DictionaryTerm> getTerms() {
		return new ArrayList<>(termMap.values());
	}
	
	public void setTerms(List<DictionaryTerm> terms) {
		termMap.clear();
		for (DictionaryTerm t : terms) addTerm(t);
	}

	public void addTerm(DictionaryTerm term) {
		if (termMap.containsKey(term.getId())) {
			// Merge datatypes if term already exists
			DictionaryTerm existing = termMap.get(term.getId());
			java.util.List<String> existingTypes = (java.util.List<String>) existing.getMetadataValue("datatype");
			java.util.List<String> newTypes = (java.util.List<String>) term.getMetadataValue("datatype");
			
			java.util.Set<String> combined = new java.util.HashSet<>(existingTypes);
			combined.addAll(newTypes);
			existing.addMetadata("datatype", new java.util.ArrayList<>(combined));
		} else {
			termMap.put(term.getId(), term);
		}
	}
	
	public List<Map<String, Object>> toMapList() {
		List<Map<String, Object>> mapList = new ArrayList<>();
		for (DictionaryTerm term : termMap.values()) {
			mapList.add(term.toMap());
		}
		return mapList;
	}

	public JsonArray toJsonArray() {
		JsonArray jsonArray = new JsonArray();
		for (DictionaryTerm term : termMap.values()) {
			jsonArray.add(term.toJsonObject());
		}
		return jsonArray;
	}

	public Map<String, Object> toMap() {
		return Map.of("terms", toMapList());
	}
}
