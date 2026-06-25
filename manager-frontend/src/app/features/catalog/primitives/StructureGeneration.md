# Ontology Structure Generation (Backend Logic)

The `OntologyStructure` used by the Dynamic Primitives system is generated recursively on the backend. This guide details how the Java backend transforms raw ontology definitions into a UI-friendly JSON format.

## 1. The API Entry Point

When the frontend requests a template, the `DataStoreController` handles the request and delegates the work to the ontology core.

- **Endpoint**: `POST /api/datastore/ui-template`
- **Controller**: `DataStoreController.java`
- **Method**: `getUITemplate(@RequestBody Map<String, Object> params)`

```java
@PostMapping(value = "/ui-template", produces = "application/json")
public String getUITemplate(@RequestBody Map<String, Object> params) {
    String classname = (String) params.get("classname");
    // Calls the core generation logic
    JsonObject template = DocumentTemplateForUI.createUIDocumentTemplate(classname);
    return StandardResponse.standardServiceResponse(doc, "Success", template).toString();
}
```

## 2. Core Logic: `DocumentTemplateForUI`

The generation happens in two main phases:
1.  **Skeleton Generation**: Using `CreateDocumentTemplate` to create a raw JSON example of the class with all its properties.
2.  **UI Mapping**: Walking through that skeleton and adding the metadata flags (like `isOneLine`, `isObject`) that the Angular primitives need.

### Phase 1: Creating the Skeleton
The `createUIDocumentTemplate` method first creates a baseline structure:

```java
public static JsonObject createUIDocumentTemplate(String classname) {
    // Creates a JSON example of the class based on ontology hierarchy
    JsonObject exampleTemplate = CreateDocumentTemplate.createTemplateWithAnnotations(classname);
    
    JsonObject dataobject = exampleTemplate.get("dataobject").getAsJsonObject();
    JsonObject annotations = exampleTemplate.get("annotations").getAsJsonObject();

    JsonObject uiStructure = new JsonObject();
    // Recursively walk and transform
    recursiveLoopThroughElements(dataobject, annotations, uiStructure);
    
    exampleTemplate.add("dataobject", uiStructure);
    return exampleTemplate;
}
```

### Phase 2: Recursive Transformation
The `recursiveLoopThroughElements` method is the "worker" that builds the `OntologyStructure` expected by the frontend.

```java
private static void recursiveLoopThroughElements(JsonObject template, JsonObject annotations, JsonObject parentUI) {
    for (Entry<String, JsonElement> entry : template.entrySet()) {
        String key = entry.getKey();
        JsonElement element = entry.getValue();
        JsonObject elementUI = new JsonObject();
        parentUI.add(key, elementUI);

        // 1. Identification
        String classname = GenericSimpleQueries.classFromIdentifier(key);
        elementUI.addProperty("identifier", key);
        elementUI.addProperty("classname", classname);

        // 2. Fetch Annotations (Labels/Comments) from the Ontology
        if (annotations.has(classname)) {
            JsonObject anno = annotations.get(classname).getAsJsonObject();
            elementUI.addProperty("label", anno.get("label").getAsString());
            elementUI.addProperty("comment", anno.get("comment").getAsString());
        }

        // 3. Determine Structure Type
        if (element.isJsonObject()) {
            elementUI.addProperty("isObject", true);
            JsonObject properties = new JsonObject();
            elementUI.add("properties", properties);
            // Recursive call for nested properties
            recursiveLoopThroughElements(element.getAsJsonObject(), annotations, properties);
        } else if (element.isJsonArray()) {
            elementUI.addProperty("isArray", true);
            // ... logic to handle array item type ...
        } else {
            // Primitive field mapping
            setupPrimitiveMetadata(elementUI, classname);
        }
    }
}
```

## 3. Primitive Type Detection

The `setupPrimitiveMetadata` method uses ontology queries to determine which UI primitive should represent a specific class. It checks the inheritance hierarchy of the class against known "UI base types".

```java
private static void setupPrimitiveMetadata(JsonObject elementUI, String classname) {
    // Check if the class inherits from specific ontology base classes
    elementUI.addProperty("isClassification", GenericSimpleQueries.isSubClassOf(classname, "dataset:Classification", false));
    elementUI.addProperty("isParagraph", GenericSimpleQueries.isSubClassOf(classname, "dataset:Paragraph", false));
    elementUI.addProperty("isOneLine", GenericSimpleQueries.isSubClassOf(classname, "dataset:OnLine", false));
    elementUI.addProperty("isBoolean", GenericSimpleQueries.isSubClassOf(classname, "dataset:BooleanDataType", false));
    elementUI.addProperty("isFileSource", GenericSimpleQueries.isSubClassOf(classname, "dataset:FileSourceIdentifier", false));
    
    // Additional logic for generating choices for dropdowns (classifications)
    if (elementUI.get("isClassification").getAsBoolean()) {
        JsonObject classificationTree = DatabaseOntologyClassification.classificationTreeFromDataType(classname);
        elementUI.add("choices", classificationTree.get("dataobject"));
    }
}
```

## 4. Summary of Flow

1.  **Frontend**: "I need to render the class `dataset:ContactInformation`."
2.  **API**: Calls `/api/datastore/ui-template` with `{ "classname": "dataset:ContactInformation" }`.
3.  **Backend**: `DocumentTemplateForUI` triggers.
4.  **Skeleton**: Loads the property map for `ContactInformation`.
5.  **Traversal**: 
    - Sees `dataset:Email`. Logic finds it is a subclass of `dataset:OnLine`. Sets `isOneLine: true`.
    - Sees `dataset:WorkAddress`. Logic finds it is a complex `isObject: true`. recurses.
6.  **Response**: Returns the fully annotated JSON object which the Angular `DynamicPrimitiveComponent` consumes.
