package info.esblurock.reaction.core.ontology.base.transaction;


import java.util.List;

import org.junit.Test;

public class TestActivityFromTransaction {

	@Test
	public void test() {
		System.out.println("--------------------   sourceDataOfTransaction");
		String transaction1 = "dataset:InitialReadFromUserInterface";
		String source = TransactionConceptParsing.sourceDataOfTransaction(transaction1);
		System.out.println(transaction1 + "  source: " + source);
		System.out.println("--------------------   activityOfTransaction");

		System.out.println("--------------------   requirementsOfTransaction");
		String dependent = " dataset:TransferFileIntoCatagoryHierarchy";
		List<String> requirements = TransactionConceptParsing.requirementsOfTransaction(dependent);
		System.out.println("Transaction: " + dependent + "\n" + requirements);
		System.out.println("--------------------   requirementsOfTransaction");
		
		System.out.println("--------------------   outputOfTransactionSingle");
		String output = TransactionConceptParsing.catalogOfTransactionSingle(dependent);
		System.out.println("Transaction: " + dependent + "\n" + output);
		System.out.println("--------------------   outputOfTransactionSingle");
		
	}

}
