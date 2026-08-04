Description: 
This is the instructions on how to display ThermodynamicsDatasetCollectionIDsSet

It is a subclass of MinimumDatabaseObjectStructure so base-minimum-database-object-structure.component.ts handles the minimum display. 
(/Users/edwardblurock/git/WorkFlowProject/manager-frontend/src/app/features/catalog/interfaces/base-minimum-database-object-structure.component.ts)

First display (in a mat card)
one line
1. DatasetCollectionsSetLabel (dataset:datasetcollectionslabel)
2. DatasetCollectionType (dataset:datasetcollectiontype) 
then 
DescriptionAbstract (dcterms:description)

After that:
There will be a mat-card for each of the following dataset objects (if present):
  "dataset:vibrationstructuredatabase"
  "dataset:symmetrystructuredefinitiondatabase"
  "dataset:metaatomdefinitiondatabase"
  "dataset:disassociationdatabase"
  dataset:2dmoleculethermodatabase
  "dataset:2dsubstructurethermodatabase"
  "dataset:bensonruledatabase"

For each of these display:
A full line with 
"dc:type".  and then "dcterms:creator" and then an eye button
full width:
 "rdfs:comment"
whe the eye is pressed, the rest is displayed:
A line with full width 
"<http://purl.org/dc/elements/1.1/identifier>" and
"skos:altLabel" (in paratheses)
A line with full width: 
"<http://www.linkedmodel.org/schema/dtype#derivedFrom>" and 
"<http://www.linkedmodel.org/schema/dtype#derivedFrom>" 



example values: 
 "rdfs:label": "Benson Rule Database",
    "rdfs:comment": "The Benson rule for the database",
    "skos:altLabel": "bensonruledatabase",
    "dc:type": "dataset:ThermodynamicBensonRuleDefinitionDatabase",
    "<http://purl.org/dc/elements/1.1/identifier>": "dataset:bensonruledatabase",
    "<http://www.w3.org/ns/dcat#catalog>": "dataset:ThermodynamicBensonRuleDefinitionDatabase",
    "<http://www.linkedmodel.org/schema/dtype#derivedFrom>": "dataset:ThermodynamicBensonRuleDefinitionDataSet",
    "dcterms:creator": "UOqk0KtFtaXma5TGsi8Seh9RMbx1"