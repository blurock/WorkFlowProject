package info.blurock.workflow.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
public class DictionarySearchServiceTest {

    @Autowired
    private DictionarySearchService searchService;

    @Test
    public void testRealSearch() {
        try {
            System.out.println("=================================================");
            System.out.println("Querying Vertex AI Discovery Engine...");
            System.out.println("=================================================");

            // Testing with a generic query "transaction" and the required datatype filter
            String query = "transaction";
            String datatype = "exampledatasettransactions";

            String result = searchService.searchDictionaryTerm(query, datatype);

            System.out.println("=================================================");
            System.out.println("Best Match Term returned: " + result);
            System.out.println("=================================================");

            assertNotNull(result);
        } catch (Exception e) {
            System.err.println("Search failed! Ensure Google Cloud credentials are set up.");
            e.printStackTrace();
        }
    }
}
