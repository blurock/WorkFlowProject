package info.blurock.datamanager.datastoreterms;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class CreateDataStoreTermsFromClassesTest {

    @Test
    public void testCreateDataStoreTermsFromClasses() {
        String baseClass = "dataset:ChemConnectDataStructure";
        String datatype = "classification-terms";
        
        DictionaryTermSet result = CreateDataStoreTermsFromClasses.createDataStoreTermsFromClasses(baseClass, datatype);
        
        System.out.println("Processing Hierarchy for: " + baseClass);
        System.out.println("Number of terms found: " + result.getTerms().size());

        for(DictionaryTerm term : result.getTerms()) {
            System.out.println("Term ID: " + term.getId());
            System.out.println("  Term Name: " + term.getTerm());
            System.out.println("  Description: " + term.getDescription());
            System.out.println("  Metadata: " + term.getMetadata());
        }
        
        assertNotNull(result, "Resulting DictionaryTermSet should not be null");
        assertTrue(result.getTerms().size() > 0, "Should have found some terms in the hierarchy of " + baseClass);
        
        // Check if metadata contains the correct datatype
        if (result.getTerms().size() > 0) {
            DictionaryTerm firstTerm = result.getTerms().get(0);
            java.util.List<String> datatypes = (java.util.List<String>) firstTerm.getMetadataValue("datatype");
            assertTrue(datatypes.contains(datatype), "Term should have the correct datatype in metadata");
        }
    }
}
