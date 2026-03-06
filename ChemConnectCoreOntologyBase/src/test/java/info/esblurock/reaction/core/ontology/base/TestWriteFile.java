package info.esblurock.reaction.core.ontology.base;

import static org.junit.Assert.*;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintStream;

import org.junit.Test;

public class TestWriteFile {

	@Test
	public void test() {
		String fileS = "src/Testfile";
		File f = new File(fileS);
		try {
			PrintStream ostr = new PrintStream(f);
			ostr.println("This is the string");
			ostr.close();
			InputStream istr = new FileInputStream(fileS);
				byte[] bytes = istr.readAllBytes();
				System.out.println(bytes);
				istr.close();
			
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

}
