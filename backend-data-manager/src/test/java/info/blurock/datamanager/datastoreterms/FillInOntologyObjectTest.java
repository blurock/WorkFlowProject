package info.blurock.datamanager.datastoreterms;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class FillInOntologyObjectTest {

    @Autowired
    private FillInOntologyObject fillInService;

    @Test
    public void testFillInProperties() throws IOException {
        String classname = "dataset:ActivityRepositoryInitialReadLocalFile";
        String datatype = "activity";
        String prompt = "I want to upload a text file  with the title 'Energy Calculation' The dataset type is Benson Rules. ";
        
        System.out.println("---------------------------------------");
        System.out.println("Testing FillInOntologyObject for: " + classname);
        System.out.println("Prompt: " + prompt);
        
        FillInOntologyObject.FillInResult result = fillInService.fillInProperties(prompt, classname, datatype);
        
        System.out.println("Assigned Properties:");
        result.getAssignedProperties().forEach((k, v) -> System.out.println("  " + k + " = " + v));
        
        System.out.println("Unassigned Properties:");
        result.getUnassignedProperties().forEach(p -> System.out.println("  " + p));
        System.out.println("---------------------------------------");
        
        assertNotNull(result);
        assertNotNull(result.getAssignedProperties());
        assertNotNull(result.getUnassignedProperties());
        
        // We expect at least one of these to be filled based on the prompt
        // (dataset:DescriptionTitle or dataset:FileSourceIdentifier or dataset:FileSourceMediaType)
        assertFalse(result.getAssignedProperties().isEmpty(), "Result should have some assigned properties");
    }
}
