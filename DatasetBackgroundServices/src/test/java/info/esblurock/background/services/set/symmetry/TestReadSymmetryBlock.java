package info.esblurock.background.services.set.symmetry;

import static org.junit.Assert.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.dom4j.Document;
import org.dom4j.Element;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.jthermodynamics.symmetry.InterpretSymmetryBlock;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestReadSymmetryBlock {

	@Test
	public void test() {
		String srcpath = "src/test/java/resources/symmetrydefinition/SymmetryDefinition.xml";
		String content;
		try {
			content = Files.readString(Paths.get(srcpath));
			Document document = MessageConstructor.startDocument("PartiionSetWithinRepositoryFile");
			Element body = MessageConstructor.isolateBody(document);
			Element table = body.addElement("table");
			JsonObject catalog = InterpretSymmetryBlock.interpret(content,table);
			System.out.println(JsonObjectUtilities.toString(catalog));
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		
		
	}

}
