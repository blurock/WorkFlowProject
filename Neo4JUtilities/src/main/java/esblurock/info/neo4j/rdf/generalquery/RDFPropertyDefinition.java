package esblurock.info.neo4j.rdf.generalquery;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;

public class RDFPropertyDefinition {
	String propertyClassString;
	String propertyID;
	String altLabelString;
	String labelString;
	String commentString;
	
	public RDFPropertyDefinition(String propertyClassString) {
		this.propertyClassString = propertyClassString;
		this.propertyID = DatasetOntologyParseBase.getIDFromAnnotation(propertyClassString);
		this.altLabelString = DatasetOntologyParseBase.getAltLabelFromAnnotation(propertyClassString);
		this.labelString = DatasetOntologyParseBase.getLabelFromAnnotation(propertyClassString);
		this.commentString = DatasetOntologyParseBase.getCommentFromAnnotation(propertyClassString);
	}
	
	public String getPropertyClassString() {
		return propertyClassString;
	}

	public void setPropertyClassString(String propertyClassString) {
		this.propertyClassString = propertyClassString;
	}

	public String getPropertyID() {
		return propertyID;
	}

	public void setPropertyID(String propertyID) {
		this.propertyID = propertyID;
	}

	public String getAltLabelString() {
		return altLabelString;
	}

	public void setAltLabelString(String altLabelString) {
		this.altLabelString = altLabelString;
	}
	
	@Override
	public String toString() {
		return propertyID + " : " + altLabelString + " : " + propertyClassString+ "\n";
	}
    
	JsonObject toJsonObject( ) {
		JsonObject obj = CreateDocumentTemplate.createTemplate(ClassLabelConstants.RDFPropertyDefinition);
		obj.addProperty(ClassLabelConstants.CatalogObjectType, propertyClassString);
		obj.addProperty(ClassLabelConstants.DescriptionTitle, labelString);
		obj.addProperty(ClassLabelConstants.DescriptionAbstract, commentString);
		return obj;
	}
}
