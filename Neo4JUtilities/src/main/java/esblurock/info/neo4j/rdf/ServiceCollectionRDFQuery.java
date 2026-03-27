package esblurock.info.neo4j.rdf;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;

public enum ServiceCollectionRDFQuery {
	
	RDFQuerySubjectNodeWithProperty {
		@Override
		public String getServiceName() {
			return ClassLabelConstants.RDFQuerySubjectNodeWithProperty;
		}

		@Override
		public String getServiceDescription() {
			return DatasetOntologyParseBase.getCommentFromAnnotation(ClassLabelConstants.RDFQuerySubjectNodeWithProperty);
		}

		@Override
		JsonObject executeService(JsonObject input) {
			String titleString = input.get(ClassLabelConstants.DescriptionTitle).getAsString();
			String KeyString = input.get(ClassLabelConstants.RDFSubjectKey).getAsString();
			String ownerString = input.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
			String propertyString = input.get(ClassLabelConstants.RDFSubjectProperty).getAsString();
			return QueryRDF.retreiveSubjectNodeWithProperty(KeyString, propertyString, ownerString, titleString);
		}
	}, 
	RDFQueryRelationWithType {

		@Override
		String getServiceName() {
			// TODO Auto-generated method stub
			return null;
		}

		@Override
		String getServiceDescription() {
			// TODO Auto-generated method stub
			return null;
		}

		@Override
		JsonObject executeService(JsonObject input) {
			String titleString = input.get(ClassLabelConstants.DescriptionTitle).getAsString();
			String KeyString = input.get(ClassLabelConstants.RDFSubjectKey).getAsString();
			String ownerString = input.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
			String propertyString = input.get(ClassLabelConstants.RDFSubjectProperty).getAsString();
			return QueryRDF.retreiveSubjectNodeWithProperty(KeyString, propertyString, ownerString, titleString);
		}
		
	};
	
	abstract String getServiceName();
	abstract String getServiceDescription();
	abstract JsonObject executeService(JsonObject input);

}
