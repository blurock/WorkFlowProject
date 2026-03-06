package info.esblurock.reaction.core.ontology.base.rdfs;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.OntologyObjectLabels;
import info.esblurock.reaction.core.ontology.base.dataset.BaseObjectJSONInterface;

public class ListOfRDFInformation extends BaseObjectJSONInterface {
	
	List<RDFInformation> lst;
	
	public ListOfRDFInformation() {
		lst = new ArrayList<RDFInformation>();
	}
	
	public void addRDFInformation(RDFInformation info) {
		lst.add(info);
	}
	public void addRDFInformation(ListOfRDFInformation more) {
		if(more != null) {
			lst.addAll(more.getList());
		}
	}
	
	public List<RDFInformation> getList() {
		return lst;
	}

	@Override
	public JsonObject toJsonObject() {
		JsonObject json = new JsonObject();
		JsonArray jlst = new JsonArray();
		Iterator<RDFInformation> iter = lst.iterator();
		while(iter.hasNext()) {
			RDFInformation info = iter.next();
			JsonObject jrdf = info.toJsonObject();
			jlst.add(jrdf);
		}
		json.add(OntologyObjectLabels.rdflist, jlst);
		return json;
	}

}
