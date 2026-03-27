package esblurock.info.neo4j.rdf;

import java.util.Map;

public class RDFQueryInput {
	
	Map<String,Object> subjectprops;
	String subjectClassString;
	Map<String,Object> relationprops;
	String relationClass;
	Map<String,Object> objectprops;
	String objectClass;
	String owner;
	String transactionID;
	String catalogid;
	String title;
	String returnString;
	
	public RDFQueryInput( String transactionID, String owner, String catalogid, String title, String returnString) {
		this.owner = owner;
		this.title = title;
		this.catalogid = catalogid;
		this.returnString = returnString;
		this.transactionID = transactionID;
	}
	
	public void addSubject(String subject, Map<String,Object> subjectprops) {
        this.subjectClassString = subject;
        this.subjectprops = subjectprops;
    }

	public void addRelation(String relation, Map<String, Object> relationprops) {
		this.relationClass = relation;
		this.relationprops = relationprops;
	}

	public void addObject(String object, Map<String, Object> objectprops) {
		this.objectClass = object;
		this.objectprops = objectprops;
	}

	public Map<String, Object> getSubjectprops() {
		return subjectprops;
	}

	public void setSubjectprops(Map<String, Object> subjectprops) {
		this.subjectprops = subjectprops;
	}

	public String getSubjectClassString() {
		return subjectClassString;
	}

	public void setSubjectClassString(String subjectClassString) {
		this.subjectClassString = subjectClassString;
	}

	public Map<String, Object> getRelationprops() {
		return relationprops;
	}

	public void setRelationprops(Map<String, Object> relationprops) {
		this.relationprops = relationprops;
	}

	public String getRelationClass() {
		return relationClass;
	}

	public void setRelationClass(String relationClass) {
		this.relationClass = relationClass;
	}

	public Map<String, Object> getObjectprops() {
		return objectprops;
	}

	public void setObjectprops(Map<String, Object> objectprops) {
		this.objectprops = objectprops;
	}

	public String getObjectClass() {
		return objectClass;
	}

	public void setObjectClass(String objectClass) {
		this.objectClass = objectClass;
	}

	public String getOwner() {
		return owner;
	}

	public void setOwner(String owner) {
		this.owner = owner;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getReturnString() {
		return returnString;
	}

	public void setReturnString(String returnString) {
		this.returnString = returnString;
	}

	public String getTransactionID() {
		return transactionID;
	}

	public void setTransactionID(String transactionID) {
		this.transactionID = transactionID;
	}
	
	public String getCatalogid() {
		return catalogid;
	}

	public void setCatalogid(String catalogid) {
		this.catalogid = catalogid;
	}

	public String toString() {
		StringBuffer buffer = new StringBuffer();
		buffer.append("RDFQueryInput: \n");
		buffer.append("Owner: " + owner + "\n");
		buffer.append("Title: " + title + "\n");
		buffer.append("ReturnString: " + returnString + "\n");
		buffer.append("SubjectClass: " + subjectClassString + "\n");
		buffer.append("SubjectProperties: " + subjectprops.toString() + "\n");
		buffer.append("RelationClass: " + relationClass + "\n");
		buffer.append("RelationProperties: " + relationprops.toString() + "\n");
		buffer.append("ObjectClass: " + objectClass + "\n");
		buffer.append("ObjectProperties: " + objectprops.toString() + "\n");
		return buffer.toString();
	}

}
