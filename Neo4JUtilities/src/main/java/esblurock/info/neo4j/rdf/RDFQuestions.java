package esblurock.info.neo4j.rdf;

import static org.hamcrest.CoreMatchers.nullValue;

import com.google.gson.JsonObject;

public enum RDFQuestions {
	FindListOfCatalogObjectUniqueGenericLabel  {
		@Override
		public JsonObject process(JsonObject input) {
			return RDFQuestionsUtilities.FindListOfCatalogObjectUniqueGenericLabel(input);
		}
	},
	FindTreeOfPrerequisiteTransactions{

	@Override
	public JsonObject process(JsonObject input) {
		return RDFQuestionsUtilities.FindTreeOfPrerequisiteTransactions(input);
	}

	},
	FindCatalogObjectsFromUniqueGenericLabelAndType {
		@Override
		public JsonObject process(JsonObject input) {
			return RDFQuestionsUtilities.CatalogObjectsFromUniqueGenericLabel(input);
		}
	},
	FindDataSetObjectsWithCenterAtom{

	@Override
	public JsonObject process(JsonObject input) {
		return RDFQuestionsUtilities.findDataSetObjectsWithCenterAtom(input);
	}
	},
	FindResponsitoryFileAndFileType {

		@Override
		public JsonObject process(JsonObject input) {
			return null;
			//return RDFQuestionsUtilities.findResponsitoryFileAndFileType(input);
		}
	},
	GeneralRDFQuery {
		@Override
		public JsonObject process(JsonObject input) {
			return RDFQuestionsUtilities.RDFGeneralQueryWithJson(input);
		}
	};

	
	
	
	public abstract JsonObject process(JsonObject input);

}
