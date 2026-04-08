package info.esblurock.background.services.transaction;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestCreateA2DSpeciesFromGraphicInterface {

    @Test
    public void test() {
        try {
            InitiallizeSystem.initialize();

            String jsonS = "{"
                    + "\"prov:activity\": \"dataset:CreateA2DSpeciesFromGraphicInterface\","
                    + "\"dataset:transreqobj\": {},"
                    + "\"dataset:activityinfo\": {"
                    + "  \"dataset:speciesformat\": ["
                    + "    {"
                    + "      \"dataset:molfiletype\": \"dataset:SpeciesRepresentationMolFileV2000\","
                    + "      \"dataset:speciesrepresentation\": \"\\n  Ketcher  4 42615312D 1   1.00000     0.00000     0\\n\\n  5  4  0  0  0  0  0  0  0  0999 V2000\\n    1.2420   -4.7750    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\\n    2.1080   -4.2750    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\\n    2.9740   -4.7750    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\\n    3.8401   -4.2750    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\\n    2.1080   -3.2750    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\\n  1  2  1  0     0  0\\n  2  3  1  0     0  0\\n  3  4  1  0     0  0\\n  2  5  1  0     0  0\\nM  RAD  1   2   2\\nM  END\\n\""
                    + "    },"
                    + "    {"
                    + "      \"dataset:molfiletype\": \"dataset:SpeciesRepresentationSMILES\","
                    + "      \"dataset:speciesrepresentation\": \"C[C](C)CC |^1:1|\""
                    + "    }"
                    + "  ],"
                    + "  \"dataset:authorizationuid\": \"UOqk0KtFtaXma5TGsi8Seh9RMbx1\","
                    + "  \"dcterms:created\": \"2026-04-04T13:31:08.814Z\","
                    + "  \"dataset:catalogtype\": \"dataset:ActivitySpeciesCatalogObjectCreation\","
                    + "  \"dcterms:title\": \"Activity Species Catalog Object Creation\","
                    + "  \"<http://purl.org/dc/elements/1.1/identifier>\": \"dataset:speciescatalogobjectcreation\""
                    + "},"
                    + "\"uid\": \"UOqk0KtFtaXma5TGsi8Seh9RMbx1\""
                    + "}";

            String maintainer = "Admin";

            System.out.println("=== INPUT JSON ===");
            JsonObject json = JsonObjectUtilities.jsonObjectFromString(jsonS);
            System.out.println(JsonObjectUtilities.toString(json));

            System.out.println("=== CALLING TransactionProcess.processFromTransaction ===");
            JsonObject response = TransactionProcess.processFromTransaction(json, maintainer);

            System.out.println("=== RESPONSE ===");
            System.out.println(JsonObjectUtilities.toString(response));

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
