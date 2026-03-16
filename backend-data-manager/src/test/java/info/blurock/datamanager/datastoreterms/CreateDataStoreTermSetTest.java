package info.blurock.datamanager.datastoreterms;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class CreateDataStoreTermSetTest {

    @Test
    public void testCreateDataStoreTermSetBasic() {
        // Simple assertion to ensure test framework is wired up and the test directory is found.
        // A true dictionary load test requires actual ontology instances and likely specific base class names.
        String baseClass = "dataset:ActivityInformationRecordThermodynamics";
        String datatype = "terms";
        DictionaryTermSet result = CreateDataStoreTermSet.createDataStoreDataObjectTermSet(baseClass, datatype);
        System.out.println("Number of terms: " + result.getTerms().size());

        for(DictionaryTerm term : result.getTerms()) {
            System.out.println(term.getTerm());
            System.out.println("\t\t\t" + term.getDescription());
        }   
        assertNotNull(result);

        assertTrue(result.getTerms().size() > 0, "The test directory is successfully configured for the datastoreterms package.");
    }
}
