package info.esblurock.reaction.core.ontology.base.dataset;

import com.google.gson.JsonObject;

public abstract class BaseObjectInterface {
	public abstract JsonObject toJsonObject();
	public abstract void fillJsonObject(JsonObject obj);
	
	@Override
	public String toString() {
		return toString("");
	}
	public abstract String toString(String prefix); 
}
