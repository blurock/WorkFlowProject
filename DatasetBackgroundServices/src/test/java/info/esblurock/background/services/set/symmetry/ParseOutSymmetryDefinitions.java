package info.esblurock.background.services.set.symmetry;

import static org.junit.Assert.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.junit.Test;

import info.esblurock.background.services.utilities.XMLUtilityRoutines;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;

public class ParseOutSymmetryDefinitions {

	@Test
	public void test() {
		String srcpath = "src/test/java/resources/symmetrydefinition/ExternalSymmetryCarbonAtom.xml";
			try {
				String content = Files.readString(Paths.get(srcpath));
				String[] blocks = XMLUtilityRoutines.parseObjectsFromXMLString(content, ClassLabelConstants.JThermodynamicsSymmetryStructureDefinition);
				System.out.println("Read in " + blocks.length + "");
				for(int i=0; i<blocks.length;i++) {
					System.out.println("---------------------------------------------------------");
					System.out.println(blocks[i]);
					System.out.println("---------------------------------------------------------");
				}
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
	}

}
