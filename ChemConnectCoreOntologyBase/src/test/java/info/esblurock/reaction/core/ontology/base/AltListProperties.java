package info.esblurock.reaction.core.ontology.base;


import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

import org.junit.Test;

import info.esblurock.reaction.core.ontology.base.setup.SetupAltLabelList;

public class AltListProperties {

	@Test
	public void test() {
		System.out.println("----------------------------------------");
		String classfile = "ClassLabelConstants.java";
		Path filePath = Paths.get("./src/main/java/info/esblurock/reaction/core/ontology/base/constants", classfile);
		 
        try
        {
        	String content = SetupAltLabelList.listToString();
        	System.out.println(content);
            //Write content to file
            Files.writeString(filePath,content);
         } 
        catch (IOException e) 
        {
            e.printStackTrace();
        }
	}

}
