package info.esblurock.reaction.core.ontology.base.dataset;

public class CompoundObjectDimensionInformation {
	String classname;
	String cardinality;
	boolean singlet;
	boolean compoundobject;
	boolean classification;
	
	public CompoundObjectDimensionInformation() {
	}

	/**
	 * @param classname
	 * @param cardinality
	 * @param classification: 
	 * @param singlet
	 * @param compoundobject
	 */
	public CompoundObjectDimensionInformation(String classname, String cardinality, 
			boolean singlet, boolean compoundobject, boolean classification) {
		this.classname = classname;
		this.cardinality = cardinality;
		this.singlet = singlet;
		this.compoundobject = compoundobject;
		this.classification = classification;
	}

	public String getClassname() {
		return classname;
	}

	public void setClassname(String classname) {
		this.classname = classname;
	}

	public String getCardinality() {
		return cardinality;
	}

	public void setCardinality(String cardinality) {
		this.cardinality = cardinality;
	}

	public boolean isSinglet() {
		return singlet;
	}

	public void setSinglet(boolean singlet) {
		this.singlet = singlet;
	}
	
	
	public boolean isCompoundobject() {
		return compoundobject;
	}

	public void setCompoundobject(boolean compoundobject) {
		this.compoundobject = compoundobject;
	}

	public boolean isClassification() {
		return classification;
	}

	public void setClassification(boolean classification) {
		this.classification = classification;
	}

	public String toString() {
		return toString("");
	}
	
	public String toString(String prefix) {
		StringBuilder build = new StringBuilder();
		build.append(classname);
		build.append("\t");
		build.append(" ( " + cardinality + ", " + singlet + ", " + compoundobject + ", " +  classification + ")");
		return build.toString();
	}
	
	

}
