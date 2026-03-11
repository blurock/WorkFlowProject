package info.blurock.datamanager.datastoreterms;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class ExtractDescriptionTest {

    @Autowired
    private ExtractDescription summarizer;

    @Test
    public void testExtract() throws IOException {
        String datatype = "catalogobjects";
        String prompt = "This dataset contains the benson rules for hydrocarbons with just hydrogen and carbon. "
                + "The source of the data is Benson's book on thermochemistry."
                + "The values are from Table 1A in the appendix";

        System.out.println("---------------------------------------");
        System.out.println("Testing ExtractDescription for: " + datatype);
        System.out.println("Prompt: " + prompt);

        ExtractDescription.DescriptionResult result = summarizer.extract(prompt, datatype);

        System.out.println("Extracted Description: " + result.getDescription());
        System.out.println("Extracted Title: " + result.getTitle());
        System.out.println("Extracted Keyword: " + result.getKeyword());
        System.out.println("---------------------------------------");

        assertNotNull(result);
        assertEquals(prompt, result.getDescription(), "Description should match the input prompt.");
        assertNotNull(result.getTitle(), "Title should not be null.");
        assertNotNull(result.getKeyword(), "Keyword should not be null.");

        // Check for basic summary content
        assertFalse(result.getTitle().isEmpty(), "Title should not be empty.");
        assertTrue(result.getKeyword().length() > 2, "Keyword should be a meaningful summary word.");
    }
}
