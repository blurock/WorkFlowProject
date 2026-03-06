package info.esblurock.reaction.core.ontology.base.hierarchy;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestGenerateHierarchyName {

	@Test
	public void test() {
		String classname = "dataset:DatabasePerson";
		String jsonS = "{\n"
				+ "  \"vcard:Location\": {\n"
				+ "    \"geo:location\": {\n"
				+ "      \"geo:long\": \"55.70584\",\n"
				+ "      \"geo:lat\": \"13.19321\"\n"
				+ "    },\n"
				+ "    \"vcard:postal-code\": \"22594\",\n"
				+ "    \"vcard:street-address\": \"Bandelsvagen 1\",\n"
				+ "    \"vcard:locality\": \"Lund\",\n"
				+ "    \"vcard:country-name\": \"Sweden\"\n"
				+ "  },\n"
				+ "  \"dataset:title-person\": \"Edward S. Blurock\",\n"
				+ "  \"foaf:Person\": {\n"
				+ "    \"vcard:role\": \"Researcher\",\n"
				+ "    \"foaf:name\": {\n"
				+ "      \"foaf:title\": \"Dr.\",\n"
				+ "      \"foaf:givenName\": \"Edward Samuel\",\n"
				+ "      \"foaf:familyName\": \"Blurock\"\n"
				+ "    }\n"
				+ "  },\n"
				+ "  \"dataset:descrperson\": {\n"
				+ "    \"dataset:purposeperson\": {\n"
				+ "      \"dataset:purposekeyperson\": \"dataset:PurposePrincipleInvestigator\",\n"
				+ "      \"dataset:dataconceptperson\": \"dataset:ConceptResearcher\"\n"
				+ "    },\n"
				+ "    \"dataset:abstractperson\": \"Edward S. Blurock is the principle developer of the ChemConnect System\",\n"
				+ "    \"dataset:keyword-person\": \"Researcher, Chemist, Combustion\",\n"
				+ "    \"dataset:title-person\": \"Edward S. Blurock\",\n"
				+ "    \"dcterms:created\": \"2021028\"\n"
				+ "  },\n"
				+ "  \"dataset:ContactInfoData\": [\n"
				+ "    {\n"
				+ "      \"dataset:ContactType\": \"dataset:EmailContactType\",\n"
				+ "      \"vcard:Contact\": \"edward.blurock@gmail.com\"\n"
				+ "    }\n"
				+ "  ],\n"
				+ "  \"foaf:page\": [\n"
				+ "    {\n"
				+ "      \"dataset:HttpAddressSourceLocation\": \"Unassigned classification: dataset\",\n"
				+ "      \"dataset:HttpAddress\": \"not assigned\"\n"
				+ "    }\n"
				+ "  ],\n"
				+ "  \"skos:mappingRelation\": [\n"
				+ "    {\n"
				+ "      \"qb:concept\": \"Unassigned classification: dataset:DataTypeConcept\",\n"
				+ "      \"dataset:catalogtype\": \"not assigned\",\n"
				+ "      \"dataset:catobjid\": \"not assigned\"\n"
				+ "    }\n"
				+ "  ],\n"
				+ "  \"terms:BibliographicResource\": [\n"
				+ "    {\n"
				+ "      \"datacite:PrimaryResourceIdentifier\": \"not assigned\",\n"
				+ "      \"dcterms:description\": \"not assigned\",\n"
				+ "      \"dc:creator\": [\n"
				+ "        {\n"
				+ "          \"dataset:ObjectLinkToContact\": [\n"
				+ "            \"not assigned\"\n"
				+ "          ],\n"
				+ "          \"foaf:title\": \"Unassigned classification: dataset:UserTitle\",\n"
				+ "          \"foaf:givenName\": \"not assigned\",\n"
				+ "          \"foaf:familyName\": \"not assigned\"\n"
				+ "        }\n"
				+ "      ],\n"
				+ "      \"dcterms:title\": \"not assigned\"\n"
				+ "    }\n"
				+ "  ],\n"
				+ "  \"dataset:firestorecatalog\": {\n"
				+ "    \"dataset:collectiondocpair\": [\n"
				+ "      {\n"
				+ "        \"dataset:documentid\": \"not assigned\",\n"
				+ "        \"dataset:collectionid\": \"not assigned\",\n"
				+ "        \"dataset:idlevel\": \"not assigned\"\n"
				+ "      }\n"
				+ "    ],\n"
				+ "    \"skos:inScheme\": \"Unassigned classification: dataset:DataCatalog\",\n"
				+ "    \"qb:DataSet\": \"not assigned\"\n"
				+ "  },\n"
				+ "  \"dcterms:identifier\": \"vcard:Individual\"\n"
				+ "}\n"
				+ "";
		JsonObject json = JsonObjectUtilities.jsonObjectFromString(jsonS);
		
		String hierclass1 = "dataset:CatalogHierarchyDatabasePerson";
		String name1 = CreateHierarchyElement.generateHierarchyName(hierclass1, classname, json);
		System.out.println("----------- TestGenerateHierarchyName -------------");
		System.out.println(hierclass1 + ": \n" + name1);
		
	}

}
