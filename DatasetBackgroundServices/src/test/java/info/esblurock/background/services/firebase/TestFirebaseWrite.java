package info.esblurock.background.services.firebase;

import java.io.IOException;

import org.junit.Test;

import com.google.cloud.firestore.Firestore;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.FirestoreBaseClass;
import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestFirebaseWrite {

	@Test
	public void test() {
		Firestore database;
		try {
			database = FirestoreBaseClass.getFirebaseDatabase();
			String jsonS = "{\n" + "  \"vcard:Location\": {\n" + "    \"geo:location\": {\n"
					+ "      \"geo:long\": \"55.70584\",\n" + "      \"geo:lat\": \"13.19321\"\n" + "    },\n"
					+ "    \"vcard:postal-code\": \"22594\",\n" + "    \"vcard:street-address\": \"Bandelsvagen 1\",\n"
					+ "    \"vcard:locality\": \"Lund\",\n" + "    \"vcard:country-name\": \"Sweden\"\n" + "  },\n"
					+ "  \"dataset:title-person\": \"Edward S. Blurock\",\n" + "  \"foaf:Person\": {\n"
					+ "    \"vcard:role\": \"Researcher\",\n" + "    \"foaf:name\": {\n"
					+ "      \"foaf:title\": \"Dr.\",\n" + "      \"foaf:givenName\": \"Edward Samuel\",\n"
					+ "      \"foaf:familyName\": \"Blurock\"\n" + "    }\n" + "  },\n"
					+ "  \"dataset:descr-person\": {\n" + "    \"dataset:purpose-person\": {\n"
					+ "      \"dataset:purposekey-person\": \"dataset:PurposePrincipleInvestigator\",\n"
					+ "      \"dataset:dataconcept-person\": \"dataset:ConceptResearcher\"\n" + "    },\n"
					+ "    \"dataset:abstract-person\": \"Edward S. Blurock is the principle developer of the ChemConnect System\",\n"
					+ "    \"dataset:keyword-person\": \"Researcher, Chemist, Combustion\",\n"
					+ "    \"dataset:title-person\": \"Edward S. Blurock\",\n"
					+ "    \"dcterms:created\": \"2021028\"\n" + "  },\n" + "  \"dataset:ContactInfoData\": [\n"
					+ "    {\n" + "      \"dataset:ContactType\": \"dataset:EmailContactType\",\n"
					+ "      \"vcard:Contact\": \"edward.blurock@gmail.com\"\n" + "    }\n" + "  ],\n"
					+ "  \"foaf:page\": [\n" + "    {\n"
					+ "      \"dataset:HttpAddressSourceLocation\": \"Unassigned classification: dataset\",\n"
					+ "      \"dataset:HttpAddress\": \"not assigned\"\n" + "    }\n" + "  ],\n"
					+ "  \"skos:mappingRelation\": [\n" + "    {\n"
					+ "      \"qb:concept\": \"Unassigned classification: dataset:DataTypeConcept\",\n"
					+ "      \"dataset:catalogtype\": \"not assigned\",\n"
					+ "      \"dataset:catobjid\": \"not assigned\"\n" + "    }\n" + "  ],\n"
					+ "  \"terms:BibliographicResource\": [\n" + "    {\n"
					+ "      \"datacite:PrimaryResourceIdentifier\": \"not assigned\",\n"
					+ "      \"dcterms:description\": \"not assigned\",\n" + "      \"dc:creator\": [\n" + "        {\n"
					+ "          \"dataset:ObjectLinkToContact\": [\n" + "            \"not assigned\"\n"
					+ "          ],\n" + "          \"foaf:title\": \"Unassigned classification: dataset:UserTitle\",\n"
					+ "          \"foaf:givenName\": \"not assigned\",\n"
					+ "          \"foaf:familyName\": \"not assigned\"\n" + "        }\n" + "      ],\n"
					+ "      \"dcterms:title\": \"not assigned\"\n" + "    }\n" + "  ],\n"
					+ "  \"dataset:firestorecatalog\": {\n" + "    \"dataset:collectiondocpair\": [\n" + "      {\n"
					+ "        \"dataset:documentid\": \"not assigned\",\n"
					+ "        \"dataset:collectionid\": \"not assigned\",\n"
					+ "        \"dataset:idlevel\": \"not assigned\"\n" + "      }\n" + "    ],\n"
					+ "    \"skos:inScheme\": \"Unassigned classification: dataset:DataCatalog\",\n"
					+ "    \"qb:DataSet\": \"not assigned\"\n" + "  },\n"
					+ "  \"dcterms:identifier\": \"vcard:Individual\"\n" + "}\n" + "";
			JsonObject json = JsonObjectUtilities.jsonObjectFromString(jsonS);
			JsonObject firebaseid = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(json);
			System.out.println("---------------------------------------");
			System.out.println(JsonObjectUtilities.toString(firebaseid));
			System.out.println("---------------------------------------");
			WriteFirestoreCatalogObject.write(database, json, firebaseid);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

}
