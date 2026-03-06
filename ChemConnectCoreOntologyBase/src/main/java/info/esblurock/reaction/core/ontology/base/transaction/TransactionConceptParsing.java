package info.esblurock.reaction.core.ontology.base.transaction;

import java.util.List;

import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;



public class TransactionConceptParsing {
	
		public static String sourceDataOfTransaction(String transaction) {
			String property = "<http://purl.org/dc/terms/source>";
			String source  = OntologyUtilityRoutines.exactlyOnePropertySingle(transaction, property);
			return source;
		}

		
		public static List<String> requirementsOfTransaction(String transaction) {
			String property = "<http://purl.org/dc/terms/requires>";
			List<String> requirements  = OntologyUtilityRoutines.exactlyOnePropertyMultiple(transaction, property);
			return requirements;
		}
		public static String catalogOfTransactionSingle(String transaction) {
			String property = "<http://www.w3.org/ns/dcat#catalog>";
			String output  = OntologyUtilityRoutines.exactlyOnePropertySingle(transaction, property);
			return output;
		}
		
}
