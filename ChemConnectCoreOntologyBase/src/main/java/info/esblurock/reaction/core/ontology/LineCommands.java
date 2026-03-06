package info.esblurock.reaction.core.ontology;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.PrintStream;

import org.apache.jena.query.ARQ;
import org.apache.jena.sys.JenaSystem;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.setup.SetupAltLabelList;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class LineCommands {

	static String packagedirectory = "src/main/java/";
	static String constantsdirectory = "info/esblurock/reaction/core/ontology/base/constants";
	static String altlabelconstants = "AltLabelConstants";

	public static void main(String[] args) {
        ARQ.init();
 		if (args.length > 0) {
			String command = args[0];
			if (command.equals("BuildAltLabel")) {
				String classAsString = SetupAltLabelList.listToString();
				String directory = packagedirectory + "/" + constantsdirectory;
				File file = new File(directory, altlabelconstants);
				try {
					PrintStream str = new PrintStream(file);
					str.print(classAsString);
					str.close();
				} catch (FileNotFoundException e) {
					System.err.println("Could not find directory");
					System.err.println("Has to be run from ChemConnectCoreOntologyBase directory");
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
		System.out.println("Ontology Commands");
		System.out.println("BuildAltLabel: Build the label list");
		System.out.println("Template: Build full JsonObject Template of a class");
		System.out.println("TransactionSourceTemplate: Build full JsonObject Template of a class");
	}

}
