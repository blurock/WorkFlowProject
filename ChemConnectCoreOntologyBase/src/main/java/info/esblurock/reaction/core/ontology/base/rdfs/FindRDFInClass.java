package info.esblurock.reaction.core.ontology.base.rdfs;

import static org.hamcrest.CoreMatchers.nullValue;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.HashMap;
import java.util.Map;

import javax.swing.plaf.basic.BasicInternalFrameTitlePane.SystemMenuBar;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.constants.OntologyObjectLabels;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.dataset.CompoundObjectDimensionInformation;
import info.esblurock.reaction.core.ontology.base.dataset.CompoundObjectDimensionSet;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.dataset.ParseCompoundObject;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;
import info.esblurock.reaction.core.ontology.base.utilities.GenericSimpleQueries;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;

public class FindRDFInClass {
	
	public static ListOfRDFInformation createFullRDFForObject(JsonObject obj) {
		String id = obj.get(AnnotationObjectsLabels.identifier).getAsString();
		String topclassname = GenericSimpleQueries.classFromIdentifier(id);
		ListOfRDFInformation complete = createFullRDFForObject(topclassname,obj);		
		return complete;
	}
	
	public static ListOfRDFInformation createFullRDFForObject(String topclassname,JsonObject obj) {
		ListOfRDFInformation complete = createRDFList(topclassname, obj);
		CompoundObjectDimensionSet set = ParseCompoundObject.getCompoundElements(topclassname);
		Iterator<CompoundObjectDimensionInformation> iter = set.iterator();
		while(iter.hasNext()) {
			CompoundObjectDimensionInformation info = iter.next();
			ListOfRDFInformation lst = createFullRDFForObject(info.getClassname(), obj);
			complete.addRDFInformation(lst);
		}
		return complete;
	}
	public static ListOfRDFInformation createRDFList(String classname, JsonObject obj) {
		ListOfRDFInformation lst = find(classname);
		return fillInValues(lst, obj);
	}
	
	/** Find the RDFs for a class
	 * 
	 * @param classname The catalog/record/component classname
	 * @return The list of RDFInformation (without values)
	 */
	public static ListOfRDFInformation find(String classname) {
		ListOfRDFInformation lst = new ListOfRDFInformation();
		List<String> elements = OntologyUtilityRoutines.exactlyOnePropertyMultiple(classname, OntologyObjectLabels.mappingRelation);
		//System.out.println("Find RDF in Class: " + classname + " with " + elements.size() + " RDF classes");
		//System.out.println("Find RDF in Class: " + elements.toString());
		Iterator<String> iter = elements.iterator();
		while(iter.hasNext()) {
			String rdfclass = iter.next();
			createBaseRDFInformation(classname, rdfclass, lst);
			//System.out.println("Find RDF in Class: " +  classname + ": " + rdfclass + "  " + lst.getList().size() + " RDF classes");
		}
		/*
		if (classname.equals("dataset:JThermodynamicsSymmetryStructureDefinitionDataSet")) {
			System.out.println("dataset:JThermodynamicsSymmetryStructureDefinitionDataSet  " + lst.getList().size() + " RDF classes");
			System.out.println("Find RDF in Class: " + classname + ": " + elements.size() + " RDF classes");
			System.out.println("Find RDF in Class: " + classname + ": " + lst.toString());
		}
		*/
		return lst;
	}
	
	
	/** fillInValues
	 * 
	 * @param lst: RDFInformationList with class information in each RDFInformation
	 * @param obj The object to extract the values
	 * @return The RDFInformationList with the values 
	 * 
	 * If there are multiple values of a subject or object, the same number extra RDFInformation are created. 
	 * 
	 * The first loop is over the set of RDFInformation objects.
	 * For each RDFInformation loop through the object classes and the subject classes.
	 * The RDFInformationList is initiated by the current RDFInformation.
	 * If either the subject or object has multiple n values, then n RDFInformations are created.
	 * The RDFInformtion is filled by the fillWithValues routine.
	 * 
	 */
	public static ListOfRDFInformation fillInValues(ListOfRDFInformation lst, JsonObject obj) {
		ListOfRDFInformation completed = new ListOfRDFInformation();
		Iterator<RDFInformation> iter = lst.getList().iterator();
		while(iter.hasNext() ) {
			RDFInformation info = iter.next();
			//System.out.println("fillInValues: " + info.getClassname());
			/*
			if (info.getClassname().equals("dataset:JThermodynamicsSymmetryStructureDefinitionDataSet")) {
				System.out.println("--------------------------------------------------------------");
				System.out.println("fillInValues: dataset:JThermodynamicsSymmetryStructureDefinitionDataSet");
				System.out.println("fillInValues: " + info.toString());
				System.out.println("-------------------------");
			}
			*/
			ListOfRDFInformation current = new ListOfRDFInformation();
			current.addRDFInformation(info);

			Set<String> subject = info.getSubjectClass().keySet();
			/*
			if (info.getClassname().equals("dataset:JThermodynamicsSymmetryStructureDefinitionDataSet")) {
				System.out.println("fillInValues: subject: " + subject.toString());
				System.out.println("-------------------------");
			}
			*/
			for(String subcls : subject) {
				if(current != null) {
					current = FindRDFInClass.fillWithValues(current,obj,subcls,true);
				}
			}
			
			Set<String> object = info.getObjectClass().keySet();
			/*
			if (info.getClassname().equals("dataset:JThermodynamicsSymmetryStructureDefinitionDataSet")) {
				System.out.println("fillInValues: object: " + object.toString());
				System.out.println("-------------------------");
			}
			*/
			for(String objcls : object) {
				if(current != null) {
				current = FindRDFInClass.fillWithValues(current,obj,objcls,false);
				}
			}
			/*
			if (info.getClassname().equals("dataset:JThermodynamicsSymmetryStructureDefinitionDataSet")) {
				System.out.println("-------------------------");
				System.out.println("fillInValues: " + current.toString());
				System.out.println("fillInValues: dataset:RDFJThermodynamicsSymmetryInfoDataset");
				System.out.println("--------------------------------------------------------------");
			}
			*/
			completed.addRDFInformation(current);
		}
		return completed;
	}
	

	/**
	 * @param rdfs This is the current set of RDFInformation objects 
	 * @param obj  The object to extract the values
	 * @param id The current id of the subject or object
	 * @param subject true if subject, false if object
	 * @return The new set of RDFInformation
	 * 
	 * The outer loop is over the RDFInformation
	 * The next loop is over the multiple values of the object/subject
	 * For each multiple value, a new RDFInformation is created. 
	 * A copy of the current is made and the each new value is added to each new RDFInformaion
	 * If there are n multiple values, 
	 */
	public static ListOfRDFInformation fillWithValues(ListOfRDFInformation rdfs, JsonObject obj, String id, boolean subject) {
		ListOfRDFInformation finalrdfsInformation = new ListOfRDFInformation();
		JsonArray arr = JsonObjectUtilities.getValueUsingIdentifierMultiple(obj, id);
		if (arr.size() == 0) {
			//System.out.println("Ontology Error: fillWithValues: No values for id: " + id + "RDF: " + rdfs.getList().get(0).getPredicateClass());
			//System.out.println("Ontology Error: fillWithValues: Object: " + JsonObjectUtilities.toString(obj));
			//System.out.println("Ontology Error: fillWithValues: RDFInformation: " + JsonObjectUtilities.toString(rdfs.getList().get(0).toJsonObject()));
			finalrdfsInformation = null;
		}
		List<RDFInformation> rdflist = rdfs.getList();
		for(RDFInformation rdf: rdflist) {
			//if (rdf.getClassname().equals("dataset:JThermodynamicsSymmetryStructureDefinitionDataSet")) {
			//	System.out.println("fillWithValues: "+ id + subject + " " + JsonObjectUtilities.toString(arr));
			//}
			for (JsonElement val : arr) {
				String valueString = "";
				if(val.isJsonObject()) {
					valueString = JsonObjectUtilities.toString((JsonObject) val);
				} else if(val.isJsonArray()) {
					valueString = JsonObjectUtilities.toString((JsonArray) val);
				} else {
					valueString = val.getAsString();
				}
				RDFInformation newRDF = new RDFInformation(rdf);
				//if (rdf.getClassname().equals("dataset:JThermodynamicsSymmetryStructureDefinitionDataSet")) {
				//	System.out.println("fillWithValues: dataset:JThermodynamicsSymmetryStructureDefinitionDataSet: '" + valueString + "'");
				//}
				
				if(subject) {
					newRDF.addSubjectValue(id,valueString);
				} else {
					newRDF.addObjectValue(id,valueString);
				}
				//if (rdf.getClassname().equals("dataset:JThermodynamicsSymmetryStructureDefinitionDataSet")) {
				//	System.out.println("fillWithValues: " + newRDF.toString());
				//}
				finalrdfsInformation.addRDFInformation(newRDF);				
			}
		}
		return finalrdfsInformation;
	}
  

	/** Fill in information from RDF class
	 * 
	 * @param classname The ontology RDF class description
	 * @param rdfclass The RDF class having the RDF information
	 * @param lst The list of base RDFInfomration
	 * 
	 * Within the RDF class name, find the list of entities (objects) and subjects class names.
	 * Loop over these two lists of classes and convert them to two lists of identities.
	 * Create an RDFInformation with the list of subject identities, the list of object identities, 
	 * 
	 */
	private static void createBaseRDFInformation(String classname, String rdfclass, ListOfRDFInformation lst) {
		List<String> entities = OntologyUtilityRoutines.exactlyOnePropertyMultiple(rdfclass, OntologyObjectLabels.entity);
		Map<String,Object> objids = new HashMap<String,Object>();
		for (String objclass : entities) {
			String id = DatasetOntologyParseBase.getIDFromAnnotation(objclass);
			objids.put(id, "");
		}
		List<String> subjects = OntologyUtilityRoutines.exactlyOnePropertyMultiple(rdfclass, OntologyObjectLabels.subject);
		Map<String,Object> subjectids= new HashMap<String,Object>();
		for (String subject : subjects) {
			String id = DatasetOntologyParseBase.getIDFromAnnotation(subject);
			subjectids.put(id, "");
		}
		RDFInformation rdfInformation = new RDFInformation(classname, subjectids,rdfclass, objids);
		lst.addRDFInformation(rdfInformation);
	}
	
}
