package info.blurock.datamanager.datastoreterms;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class DataTermsUtilitiesTest {

    @Test
    public void testGetSimpleProperties() {
        String classname = "dataset:ActivityRepositoryInitialReadLocalFile";
        List<String> properties = DataTermsUtilities.getSimpleProperties(classname);
        
        System.out.println("---------------------------------------");
        System.out.println("Simple properties for " + classname + ":");
        for (String prop : properties) {
            System.out.println("- " + prop);
        }
        System.out.println("Total count: " + properties.size());
        System.out.println("---------------------------------------");
        
        assertNotNull(properties);
        assertFalse(properties.isEmpty(), "Properties list should not be empty for " + classname);
        
        // Basic check for expected classnames in this specific class
        assertTrue(properties.contains("dataset:DateCreated") || properties.contains("dataset:FileSourceIdentifier"), 
                   "Should contain common ontology classnames");
    }
}
