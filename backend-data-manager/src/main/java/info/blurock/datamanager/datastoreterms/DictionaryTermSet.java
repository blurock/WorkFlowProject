package info.blurock.datamanager.datastoreterms;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.google.gson.JsonArray;

public class DictionaryTermSet {

	List<DictionaryTerm> terms;
	
	public DictionaryTermSet() {
		this.terms = new ArrayList<DictionaryTerm>();
	}
	
	public List<DictionaryTerm> getTerms() {
		return terms;
	}
	
	public void setTerms(List<DictionaryTerm> terms) {
		this.terms = terms;
	}

	public void addTerm(DictionaryTerm term) {
		this.terms.add(term);
	}
	
	public List<Map<String, Object>> toMapList() {
		List<Map<String, Object>> mapList = new ArrayList<>();
		for (DictionaryTerm term : terms) {
			Map<String, Object> termMap = term.toMap();
			mapList.add(termMap);
		}
		return mapList;
	}

	public JsonArray toJsonArray() {
		JsonArray jsonArray = new JsonArray();
		for (DictionaryTerm term : terms) {
			jsonArray.add(term.toJsonObject());
		}
		return jsonArray;
	}

	public Map<String, Object> toMap() {
		return Map.of("terms", toMapList());
	}
}
