package info.esblurock.background.services;

import static org.junit.Assert.*;

import java.io.IOException;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestFirestoreServiceWriteCatalogObject {

	@Test
	public void test() {
		String bodyS = "{\n" + "    service: \"FirestoreServiceWriteCatalogObject\",\n"
				+ "  \"dataset:firestorecatalog\": {\n" + "    \"dcterms:identifier\": \"dataset:firestorecatalog\",\n"
				+ "    \"skos:inScheme\": \"usrinfo\",\n" + "    \"qb:DataSet\": \"Edward Blurock\",\n"
				+ "    \"dataset:addressidpairs\": {\n" + "      \"dataset:collectiondocpair\": []\n" + "    }\n"
				+ "  },\n" + "      \"dataset:simpcatobj\": {\n" + "    \"dcterms:identifier\": \"vcard:Individual\",\n"
				+ "    \"dataset:readaccess\": \"not assigned\",\n"
				+ "    \"dataset:objectype\": \"Unassigned classification: dataset:DatabaseObjectType\",\n"
				+ "    \"transaction\": \"not assigned\",\n" + "    \"dataset:catalogkey\": \"not assigned\",\n"
				+ "    \"dataset:accessmodify\": \"not assigned\",\n" + "    \"dcterms:creator\": \"not assigned\",\n"
				+ "    \"dataset:title-person\": \"not assigned\",\n" + "    \"terms:BibliographicResource\": [\n"
				+ "      {\n" + "        \"dc:creator\": [\n" + "          {\n"
				+ "            \"foaf:title\": \"dataset:Lord\",\n"
				+ "            \"foaf:familyName\": \"not assigned\",\n"
				+ "            \"foaf:givenName\": \"not assigned\",\n"
				+ "            \"dataset:ObjectLinkToContact\": [\n" + "              \"not assigned\"\n"
				+ "            ]\n" + "          }\n" + "        ],\n"
				+ "        \"dcterms:description\": \"not assigned\",\n"
				+ "        \"datacite:PrimaryResourceIdentifier\": \"not assigned\",\n"
				+ "        \"dcterms:title\": \"not assigned\"\n" + "      }\n" + "    ],\n" + "    \"foaf:page\": [\n"
				+ "      {\n" + "        \"dataset:HttpAddress\": \"not assigned\",\n"
				+ "        \"dataset:httpinformationtype\": \"Unassigned classification: dataset:HttpAddressInformationType\"\n"
				+ "      }\n" + "    ],\n" + "    \"dataset:firestorecatalog\": {\n"
				+ "      \"skos:inScheme\": \"Unassigned classification: dataset:DataCatalog\",\n"
				+ "      \"qb:DataSet\": \"not assigned\",\n" + "      \"dataset:addressidpairs\": {\n"
				+ "        \"dataset:collectiondocpair\": [\n" + "          {\n"
				+ "            \"dataset:idlevel\": \"not assigned\",\n"
				+ "            \"dataset:collectionid\": \"not assigned\",\n"
				+ "            \"dataset:documentid\": \"not assigned\"\n" + "          }\n" + "        ]\n"
				+ "      }\n" + "    },\n" + "    \"skos:mappingRelation\": [\n" + "      {\n"
				+ "        \"dataset:catobjid\": \"not assigned\",\n"
				+ "        \"dataset:catalogtype\": \"not assigned\",\n"
				+ "        \"qb:concept\": \"Unassigned classification: dataset:DataTypeConcept\"\n" + "      }\n"
				+ "    ],\n" + "    \"dataset:descr-person\": {\n" + "      \"dcterms:created\": \"not assigned\",\n"
				+ "      \"dataset:title-person\": \"not assigned\",\n" + "      \"dataset:keyword-person\": [\n"
				+ "        \"not assigned\"\n" + "      ],\n" + "      \"dataset:abstract-person\": \"not assigned\",\n"
				+ "      \"dataset:purpose-person\": {\n"
				+ "        \"dataset:dataconcept-person\": \"Unassigned classification: dataset:ConceptPerson\",\n"
				+ "        \"dataset:purposekey-person\": \"Unassigned classification: dataset:PurposePerson\"\n"
				+ "      }\n" + "    },\n" + "    \"foaf:Person\": {\n"
				+ "      \"vcard:role\": \"dataset:ConceptTechnician\",\n" + "      \"foaf:name\": {\n"
				+ "        \"foaf:title\": \"dataset:Lord\",\n" + "        \"foaf:givenName\": \"not assigned\",\n"
				+ "        \"foaf:familyName\": \"not assigned\"\n" + "      }\n" + "    },\n"
				+ "    \"dataset:ContactInfoData\": [\n" + "      {\n"
				+ "        \"dataset:ContactType\": \"Unassigned classification: dataset:ContactType\",\n"
				+ "        \"vcard:Contact\": \"Unassigned classification: dataset:ContactKey\"\n" + "      }\n"
				+ "    ],\n" + "    \"vcard:Location\": {\n"
				+ "      \"vcard:locality\": \"Unassigned classification: dataset:LocationCity\",\n"
				+ "      \"vcard:postal-code\": \"not assigned\",\n"
				+ "      \"vcard:country-name\": \"Unassigned classification: dataset:LocationCountry\",\n"
				+ "      \"vcard:street-address\": \"not assigned\",\n" + "      \"geo:location\": {\n"
				+ "        \"geo:long\": \"not assigned\",\n" + "        \"geo:lat\": \"not assigned\"\n" + "      }\n"
				+ "    }\n" + "  }\n" + "}\n" + "";
		JsonObject body = JsonObjectUtilities.jsonObjectFromString(bodyS);
		JsonObject ans = DatabaseServicesBase.process(body);
		System.out.println(JsonObjectUtilities.toString(ans));
	}
}
