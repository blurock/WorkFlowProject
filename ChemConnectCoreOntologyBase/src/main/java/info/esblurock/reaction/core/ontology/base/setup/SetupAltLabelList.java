package info.esblurock.reaction.core.ontology.base.setup;

import java.util.Iterator;

import info.esblurock.reaction.core.ontology.base.classification.ClassificationHierarchy;
import info.esblurock.reaction.core.ontology.base.classification.DatabaseOntologyClassification;
import info.esblurock.reaction.core.ontology.base.dataset.annotations.BaseAnnotationObjects;

public class SetupAltLabelList {

	public static String listToString() {
		StringBuilder buf = new StringBuilder();
		buf.append("package info.esblurock.reaction.core.ontology.base.constants;\n");
		buf.append("\npublic class ClassLabelConstants {\n\n");
		
		String topclass1 = "dataset:SimpleCatalogObject";
		addLabelsToList(topclass1,buf);
		String topclass2 = "dataset:ChemConnectCompoundDataStructure";
		addLabelsToList(topclass2,buf);
		String topclass3 = "dataset:ActivityInformationRecord";
		addLabelsToList(topclass3,buf);
		String topclass4 = "dataset:ChemConnectPrimitiveDataStructure";
		addLabelsToList(topclass4,buf);
		String topclass5 = "dataset:TransactionEvent";
		addLabelsToList(topclass5,buf);
		String topclass6 = "dataset:CatalogObjectWithAnnotations";
		addLabelsToList(topclass6,buf);
		String topclass7 = "dataset:CatalogObjectCollection";
		addLabelsToList(topclass7,buf);

		buf.append("}\n\n");
		return buf.toString();
	}
	
	public static void addLabelsToList(String topclass,StringBuilder buf) {
		ClassificationHierarchy hierarchy = DatabaseOntologyClassification.getClassificationHierarchy(topclass);
		addHierarchyLevelToList(hierarchy,buf);		
	}

	private static void addHierarchyLevelToList(ClassificationHierarchy hierarchy, StringBuilder buf) {
		String classification = hierarchy.getClassification();
		if(classification.startsWith("dataset:")) {
			classification = classification.substring(8);
		}
		buf.append("public static String ");
		buf.append(classification);
		buf.append(" = ");
		int csize = classification.length();
		int rest = 45-csize;
		for(int i=0;i<rest;i++) {
			buf.append(" ");
		}
		BaseAnnotationObjects annotations = hierarchy.getAnnotations();
		buf.append("\"");
		buf.append(annotations.getIdentifier());
		buf.append("\"");
		buf.append(";\n");
		
		Iterator<ClassificationHierarchy> iter = hierarchy.getSubclassificatons().iterator();
		while(iter.hasNext()) {
			ClassificationHierarchy subhierarchy = iter.next();
			addHierarchyLevelToList(subhierarchy, buf);
		}
	}
}
