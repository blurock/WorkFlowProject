package info.esblurock.reaction.core.ontology.base.dataset.annotations;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;

public class BaseAnnotationObjects {
	String label;
	String comment;
	String altlabel;
	String type;
	String identifier;
	
	public BaseAnnotationObjects() {
	}
	
	public BaseAnnotationObjects(String label, String comment, String altlabel, String type, String identifier) {
		super();
		fill(label,comment,altlabel,type,identifier);
	}
	
	public BaseAnnotationObjects(BaseAnnotationObjects base) {
		super();
		fill(base.label,base.comment,base.altlabel,base.type,base.identifier);
	}
	
	
	public void fill(String label, String comment, String altlabel, String type, String identifier) {
		this.label = label;
		this.comment = comment;
		this.altlabel = altlabel;
		this.type = type;
		this.identifier = identifier;		
	}
	
	

	public String getLabel() {
		return label;
	}
	public void setLabel(String label) {
		this.label = label;
	}
	public String getComment() {
		return comment;
	}
	public void setComment(String comment) {
		this.comment = comment;
	}
	public String getAltlabel() {
		return altlabel;
	}
	public void setAltlabel(String altlabel) {
		this.altlabel = altlabel;
	}
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
	public String getIdentifier() {
		return identifier;
	}
	public void setIdentifier(String identifier) {
		this.identifier = identifier;
	}
	
	public JsonObject toJsonObject() {
		JsonObject object = new JsonObject();
		object.addProperty(AnnotationObjectsLabels.label,label);
		object.addProperty(AnnotationObjectsLabels.comment,comment);
		object.addProperty(AnnotationObjectsLabels.altlabel,altlabel);
		object.addProperty(AnnotationObjectsLabels.type,type);
		object.addProperty(AnnotationObjectsLabels.identifier,identifier);
		return object;
	}
	
	public void fillJsonObject(JsonObject obj) {
		label = obj.get(AnnotationObjectsLabels.label).getAsString();
		comment = obj.get(AnnotationObjectsLabels.comment).getAsString();
		altlabel = obj.get(AnnotationObjectsLabels.altlabel).getAsString();
		type = obj.get(AnnotationObjectsLabels.type).getAsString();
		identifier = obj.get(AnnotationObjectsLabels.identifier).getAsString();
	}

}
