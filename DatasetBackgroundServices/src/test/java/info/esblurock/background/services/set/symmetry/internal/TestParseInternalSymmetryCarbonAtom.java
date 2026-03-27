package info.esblurock.background.services.set.symmetry.internal;

import static org.junit.Assert.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.transaction.TransactionProcess;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestParseInternalSymmetryCarbonAtom {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		read();
		parse();
		interpret();
	}
    private void parse() {
		String srcpath = "src/test/java/resources/symmetrydefinition/internal/parseInternalSymmetryCarbonAtom.json";
		String maintainer = "Administrator";
		try {
			String content = Files.readString(Paths.get(srcpath));
			JsonObject json = JsonObjectUtilities.jsonObjectFromString(content);
			JsonObject response = TransactionProcess.processFromTransaction(json,maintainer);
			JsonObjectUtilities.printResponse(response);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
    private void read() {
		String srcpath = "src/test/java/resources/symmetrydefinition/internal/readInternalSymmetryCarbonAtom.json";
		String maintainer = "Administrator";
		try {
			String content = Files.readString(Paths.get(srcpath));
			JsonObject json = JsonObjectUtilities.jsonObjectFromString(content);
			System.out.println("TestParseInternalSymmetryCarbonAtom: Interpret");
			JsonObject response = TransactionProcess.processFromTransaction(json,maintainer);
			JsonObjectUtilities.printResponse(response);
		} catch (Exception e) {
			e.printStackTrace();
		}
    	
    }
    private void interpret() {
		String srcpath = "src/test/java/resources/symmetrydefinition/internal/createInternalSymmetryCarbonAtom.json";
		String maintainer = "Administrator";
		try {
			String content = Files.readString(Paths.get(srcpath));
			JsonObject json = JsonObjectUtilities.jsonObjectFromString(content);
			JsonObject response = TransactionProcess.processFromTransaction(json,maintainer);
			JsonObjectUtilities.printResponse(response);
		} catch (Exception e) {
			e.printStackTrace();
		}
    	
    }
}
