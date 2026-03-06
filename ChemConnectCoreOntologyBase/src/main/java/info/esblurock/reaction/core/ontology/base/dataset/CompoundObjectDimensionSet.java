package info.esblurock.reaction.core.ontology.base.dataset;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;

public class CompoundObjectDimensionSet extends ArrayList<CompoundObjectDimensionInformation> {

	private static final long serialVersionUID = 1L;

	/**
	 * 
	 */
	public CompoundObjectDimensionSet() {
		super();
	}

	/**
	 * @param arg0
	 */
	public CompoundObjectDimensionSet(Collection<? extends CompoundObjectDimensionInformation> arg0) {
		super(arg0);
	}

	/**
	 * @param arg0
	 */
	public CompoundObjectDimensionSet(int arg0) {
		super(arg0);
	}
	
	public String toString() {
		return toString("");
	}
	
	public String toString(String prefix) {
		StringBuilder build = new StringBuilder();
		Iterator<CompoundObjectDimensionInformation> iter = this.iterator();
		build.append("CompoundObjectDimensionSet (" + this.size() + ")\n");
		while(iter.hasNext()) {
			build.append(iter.next().toString());
			build.append("\n");
		}
		return build.toString();
	}
	

}
