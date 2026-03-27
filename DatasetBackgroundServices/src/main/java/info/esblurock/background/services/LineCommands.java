package info.esblurock.background.services;

import org.apache.jena.query.ARQ;

import com.google.gson.JsonObject;

import info.esblurock.background.services.transaction.ProcessTransactionBase;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class LineCommands {

	public static void main(String[] args) {
		ARQ.init();
		if (args.length > 0) {
			String command = args[0];
			if (command.equals("Template")) {
				if (args.length > 1) {
					String classname = args[1];
					JsonObject obj = CreateDocumentTemplate.createTemplate(classname);
					System.out.println(JsonObjectUtilities.toString(obj));
				} else {
					System.out.println("Template classname");
					System.out.println("    classname: The name of the class in the ontology");
				}
			} else if (command.equals("TransactionSourceTemplate")) {
				if (args.length > 1) {
					String classname = args[1];
					JsonObject obj = ProcessTransactionBase.setupActivityInformationTemplate(classname);
					System.out.println(JsonObjectUtilities.toString(obj));
				} else {
					System.out.println("TransactionSourceTemplate classname");
					System.out.println("    classname: The name of the class in the ontology");
				}
			} else {
				System.out.println("Command not found: " + command);
				commands();
			}
		} else {
			System.out.println("------------------------------");
			commands();
			System.out.println("------------------------------");
		}
	}

	public static void commands() {
		System.out.println("Backround Commands");
		System.out.println("Template: Build full JsonObject Template of a class");
		System.out.println("TransactionSourceTemplate: Build full JsonObject Template of a class");
	}

}
