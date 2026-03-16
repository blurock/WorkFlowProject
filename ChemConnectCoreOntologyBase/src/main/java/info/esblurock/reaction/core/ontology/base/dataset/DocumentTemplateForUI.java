package info.esblurock.reaction.core.ontology.base.dataset;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import info.esblurock.reaction.core.ontology.base.utilities.GenericSimpleQueries;
import java.util.Set;
import java.util.Map.Entry;

/**
 * Class to generate a UI-friendly document template from the ontology.
 * It uses CreateDocumentTemplate to get the initial structure and then
 * walks through it recursively to prepare it for UI representation.
 */
public class DocumentTemplateForUI {

    private static String CLASSIFICATION = "dataset:Classification";
    private static String PARAGRAPH = "dataset:Paragraph";
    private static String ONELINE = "dataset:OnLine";
    private static String EMAIL = "dataset:Email";
    private static String URL = "dataset:HTTPAddress";
    private static String BOOLEAN = "dataset:BooleanDataType";
    private static String KEYWORD = "dataset:DescriptionKeyword";
    private static String KEYWORDSET = "dataset:DescriptionKeywordSet";
    private static String FILESOURCE = "dataset:FileSourceIdentifier";

    /**
     * Creates a UI template for a given ontology class.
     * 
     * @param classname The ontology class name
     * @return A JsonObject representing the structure for the UI.
     */
    public static JsonObject createUIDocumentTemplate(String classname) {
        // 1. Use CreateDocumentTemplate.createTemplateWithAnnotations to create a JSON
        // example of the class
        JsonObject exampleTemplate = CreateDocumentTemplate.createTemplateWithAnnotations(classname);
        if (exampleTemplate == null) {
            System.err.println("ERROR: createTemplateWithAnnotations returned null for " + classname);
            JsonObject error = new JsonObject();
            error.addProperty("error", "Failed to create template for " + classname);
            return error;
        }

        System.out.println("DEBUG: exampleTemplate entries: " + exampleTemplate.entrySet().size());

        // Get the dataobject and annotations part for recursion
        JsonElement dataobjectEl = exampleTemplate.get("dataobject");
        JsonElement annotationsEl = exampleTemplate.get("annotations");

        if (dataobjectEl == null || annotationsEl == null) {
            System.err.println("ERROR: exampleTemplate missing dataobject or annotations for " + classname);
            return exampleTemplate;
        }

        JsonObject dataobject = dataobjectEl.getAsJsonObject();
        JsonObject annotations = annotationsEl.getAsJsonObject();

        // 2. Set up a recursive loop through all elements in the class.
        JsonObject uiStructure = new JsonObject();

        recursiveLoopThroughElements(dataobject, annotations, uiStructure);
        exampleTemplate.add("dataobject", uiStructure);

        return exampleTemplate;
    }

    /**
     * Recursive loop through all elements in the class using the example template
     * as a guide.
     * 
     * @param template    The current JsonObject template being processed.
     * @param annotations The annotations for the classes.
     * @param parentUI    The JsonObject under which we are creating elements.
     */
    private static void recursiveLoopThroughElements(JsonObject template, JsonObject annotations, JsonObject parentUI) {
        System.out.println("DEBUG: template: " + template.toString());
        Set<Entry<String, JsonElement>> entries = template.entrySet();
        System.out.println("DEBUG: template: " + entries.size());
        for (Entry<String, JsonElement> entry : entries) {
            System.out.println("DEBUG: entry: " + entry.getKey());
            String key = entry.getKey();
            JsonElement element = entry.getValue();
            JsonObject elementUI = new JsonObject();
            parentUI.add(key, elementUI);

            String classname = GenericSimpleQueries.classFromIdentifier(key);

            if (classname == null) {
                classname = key;
            }
            // Add basic metadata for the field if available
            if (classname != null) {
                System.out.println("DEBUG: Resolved " + key + " to class " + classname);
            }
            elementUI.addProperty("identifier", key);
            elementUI.addProperty("classname", classname);

            if (annotations.has(classname)) {
                JsonObject anno = annotations.get(classname).getAsJsonObject();
                if (anno.has(info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels.label))
                    elementUI.addProperty("label", anno.get(info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels.label).getAsString());
                if (anno.has(info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels.comment))
                    elementUI.addProperty("comment", anno.get(info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels.comment).getAsString());
                if (anno.has("classification"))
                    elementUI.add("choices", anno.get("classification"));
            }

            if (element.isJsonObject()) {
                // Compound object
                elementUI.addProperty("isObject", true);
                elementUI.addProperty("isArray", false);
                JsonObject properties = new JsonObject();
                elementUI.add("properties", properties);
                recursiveLoopThroughElements(element.getAsJsonObject(), annotations, properties);
            } else if (element.isJsonArray()) {
                // Array
                elementUI.addProperty("isArray", true);
                JsonArray arr = element.getAsJsonArray();
                if (arr.size() > 0) {
                    JsonElement first = arr.get(0);
                    if (first.isJsonObject()) {
                        elementUI.addProperty("isObject", true);
                        JsonObject properties = new JsonObject();
                        elementUI.add("properties", properties);
                        recursiveLoopThroughElements(first.getAsJsonObject(), annotations, properties);
                    } else {
                        elementUI.addProperty("isObject", false);
                        // Primitive array - we can still treat it as a primitive with isArray=true
                        setupPrimitiveMetadata(elementUI, classname);
                    }
                }
            } else {
                // Primitive field
                elementUI.addProperty("isObject", false);
                elementUI.addProperty("isArray", false);
                setupPrimitiveMetadata(elementUI, classname);
            }
        }
    }

    private static void setupPrimitiveMetadata(JsonObject elementUI, String classname) {
        elementUI.addProperty("isClassification",
                GenericSimpleQueries.isSubClassOf(classname, CLASSIFICATION, false));
        elementUI.addProperty("isParagraph", GenericSimpleQueries.isSubClassOf(classname, PARAGRAPH, false));
        elementUI.addProperty("isOneLine", GenericSimpleQueries.isSubClassOf(classname, ONELINE, false));
        elementUI.addProperty("isEmail", GenericSimpleQueries.isSubClassOf(classname, EMAIL, false));
        elementUI.addProperty("isURL", GenericSimpleQueries.isSubClassOf(classname, URL, false));
        elementUI.addProperty("isBoolean", GenericSimpleQueries.isSubClassOf(classname, BOOLEAN, false));
        elementUI.addProperty("isKeyword", GenericSimpleQueries.isSubClassOf(classname, KEYWORD, false));
        elementUI.addProperty("isKeywordSet", GenericSimpleQueries.isSubClassOf(classname, KEYWORDSET, false));
        elementUI.addProperty("isFileSource", GenericSimpleQueries.isSubClassOf(classname, FILESOURCE, false));

        // Add choices for classification if not already added
        if (elementUI.has("choices") == false && elementUI.get("isClassification").getAsBoolean()) {
            JsonObject classificationanno = info.esblurock.reaction.core.ontology.base.classification.DatabaseOntologyClassification
                    .classificationTreeFromDataType(classname);
            if (classificationanno.has("dataobject")) {
                elementUI.add("choices", classificationanno.get("dataobject"));
            }
        }
    }
}
