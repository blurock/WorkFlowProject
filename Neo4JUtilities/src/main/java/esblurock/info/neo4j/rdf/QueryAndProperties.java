package esblurock.info.neo4j.rdf;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class QueryAndProperties {
	String predicate;
	String query;
	List<Map<String,Object>> properties;
	
	
	public QueryAndProperties(String predicate, String query) {
		this.predicate = predicate;
		this.query = query;
		this.properties = new ArrayList<Map<String,Object>>();
	}

	public List<Map<String,Object>> getProperties() {
		return properties;
	}

	public void setProperties(List<Map<String,Object>> properties) {
		this.properties = properties;
	}
	
	
	public void addProperties(Map<String, Object> properties) {
		this.properties.add(properties);
	}

	public String getPredicate() {
		return predicate;
	}

	public void setPredicate(String predicate) {
		this.predicate = predicate;
	}
	
	public String toString() {
		return toString("");
	}
	
	public String getQuery() {
		return query;
	}

	public void setQuery(String query) {
		this.query = query;
	}
	
	public String toString(String prefix) {
		StringBuffer buffer = new StringBuffer();
		buffer.append(prefix + "=========================================================== \n");
		buffer.append(prefix + "Predicate: " + predicate + "\n");
		buffer.append(prefix + "--------------------- \n");
		buffer.append(prefix + "Query    : " + query + "\n");
		for (Map<String, Object> map : properties) {
			buffer.append(prefix + "--------------------- \n");
			for (String key : map.keySet()) {
				Object object = map.get(key);
				buffer.append(prefix + "             Key: '" + key + "': '" + object + "'\n");
			}
		}
		buffer.append(prefix + "--------------------- \n");
		buffer.append(prefix + "=========================================================== \n");
		return buffer.toString();
	}
}
