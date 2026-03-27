package esblurock.info.neo4j.rdf;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;


public class MapOfQueryAndProperties {

	private Map<String, QueryAndProperties> map;
	
	
	public MapOfQueryAndProperties() {
		super();
		this.map = new HashMap<String, QueryAndProperties>();
		
	}

	public MapOfQueryAndProperties(String query, Map<String, QueryAndProperties> map) {
		this.map = map;
		
	}
	
	public QueryAndProperties initialQuery(String predicate, String query) {
		QueryAndProperties queryAndProperties = new QueryAndProperties(predicate, query);
		this.map.put(predicate, queryAndProperties);
		return queryAndProperties;
	}
	
	public void addQueryAndProperties(String query, Map<String,Object> properties) throws Exception {
		Set<String> keys = this.map.keySet();
		if(keys.contains(query)) {
			QueryAndProperties existing = this.map.get(query);
			List<Map<String, Object>> propertyList = existing.getProperties();
			propertyList.add(properties);
		} else {
			throw new Exception("Query " + query + " not found in map");
		}
    }
	
	public QueryAndProperties getQuery(String query) {
		return this.map.get(query);
	}
	
	public boolean containsQuery(String query) {
		return this.map.containsKey(query);
	}
	public String toString() {
		return toString("");
	}
	
	public String toString(String prefix) {
		StringBuffer buffer = new StringBuffer();
		for (String key : map.keySet()) {
			QueryAndProperties queryprops = map.get(key);
			String propprefix = prefix + ": " + key + ": ";
			buffer.append(queryprops.toString(propprefix));
		}
		return buffer.toString();
	}
	public Set<String> keySet() {
		return map.keySet();
	}
}
