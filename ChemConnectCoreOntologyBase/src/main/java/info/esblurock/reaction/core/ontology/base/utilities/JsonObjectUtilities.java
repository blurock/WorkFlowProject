package info.esblurock.reaction.core.ontology.base.utilities;

import com.google.common.collect.MapDifference;
import com.google.common.collect.MapDifference.ValueDifference;
import com.google.common.collect.Maps;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;

import static org.hamcrest.CoreMatchers.nullValue;

import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;

public class JsonObjectUtilities {
	
	/** Value from identifier
	 * 
	 * @param json The JsonObject to search
	 * @param identifier The identifier to search for
	 * @return The value from the identifier
	 * 
	 * If the identifier does not point to a String, then null is returned
	 * If inside or nested within a JsonArray, then one of the values is given. No guarentee which one.
	 */
	public static String getValueUsingIdentifier(JsonObject json, String identifier) {
		JsonArray arr = getValueUsingIdentifierMultiple(json,identifier);
		String ans = null;
		if(arr.size() > 0) {
			if(arr.get(0).isJsonPrimitive()) {
				ans = arr.get(0).getAsString();
			}
		}
		return ans;
	}

	/**
	 * @param json The catalog/record to search for the identifier
	 * @param identifier The identifier to get the set of values
	 * @return an array of the values
	 * 
	 * This assumes that the identifiers are unique within the catalog/record object (not repeated with object)
	 * If a single value, then one value is returned.
	 * If the identifier points to a JsonArray, then all the elements of the array are found
	 * If the identifier is within an JsonObject within the array, then all the values from the array are given
	 * 
	 */
	public static JsonArray getValueUsingIdentifierMultiple(JsonObject json, String identifier) {
		JsonArray totalarr = new JsonArray();
		for (Map.Entry<String, JsonElement> prop : json.entrySet()) {
			String id = prop.getKey();
			if (id.equals(identifier)) {
				if (prop.getValue().isJsonPrimitive()) {
					if (prop.getValue().getAsJsonPrimitive().isString()) {
						String ans = prop.getValue().getAsJsonPrimitive().getAsString();
						totalarr.add(ans);
					} else if (prop.getValue().getAsJsonPrimitive().isNumber()) {
						Number ans = prop.getValue().getAsJsonPrimitive().getAsNumber();
						totalarr.add(ans);
					} else if (prop.getValue().getAsJsonPrimitive().isBoolean()) {
						Boolean ans = prop.getValue().getAsJsonPrimitive().getAsBoolean();
						totalarr.add(ans);
					}
				} else if (prop.getValue().isJsonObject()) {
						JsonObject obj = prop.getValue().getAsJsonObject();
						totalarr.add(obj);
				} else if (prop.getValue().isJsonArray()) {
						JsonArray obj = prop.getValue().getAsJsonArray();
						totalarr.addAll(obj);
				}						
			} else {
				if (prop.getValue().isJsonObject()) {
					JsonArray ans = getValueUsingIdentifierMultiple(prop.getValue().getAsJsonObject(), identifier);
					totalarr.addAll(ans);
				} else if (prop.getValue().isJsonArray()) {
					JsonArray ans = getValueUsingIdentifierMultiple(prop.getValue().getAsJsonArray(), identifier);
					totalarr.addAll(ans);
				}
			}
		}
		return totalarr;
	}

	/**
	 * @param arr An array of JsonObjects or JsonArrays
	 * @param identifier The identifier to search for
	 * @return The list of values of the identifier.
	 * 
	 * This routine allows that a JsonArray can be an array of JsonArray objects.
	 */
	public static JsonArray getValueUsingIdentifierMultiple(JsonArray arr, String identifier) {
		JsonArray totalarr = new JsonArray();
		for (int i = 0; i < arr.size(); i++) {
			JsonElement element = arr.get(i);
			if (element.isJsonObject()) {
				JsonArray ans = getValueUsingIdentifierMultiple(element.getAsJsonObject(), identifier);
				totalarr.addAll(ans);
			} else if(element.isJsonArray()) {
				JsonArray ans = getValueUsingIdentifierMultiple(element.getAsJsonArray(), identifier);
				totalarr.addAll(ans);				
			}
		}
		return totalarr;
	}

	public static JsonArray combineJsonArray(JsonArray arr1, JsonArray arr2) {
		JsonArray answer = new JsonArray();
		for(int i=0;i < arr1.size();i++) {
			answer.add(arr1.get(i));
		}
		for(int i=0;i < arr2.size();i++) {
			answer.add(arr2.get(i));
		}
		return answer;
	}

	public static String toString(JsonObject obj) {
		Gson gson = new GsonBuilder().setPrettyPrinting().create();
		String prettyJsonString = gson.toJson(obj);
		return prettyJsonString;
		
	}
	public static String toString(JsonArray arr) {
		JsonElement element = null;
		StringBuilder build = new StringBuilder();
		try {
		
		for(int i=0; i<arr.size(); i++) {
			element = arr.get(i);
			if(element.isJsonPrimitive()) {
				build.append(element.getAsString());
			} else if(element.isJsonObject()){
			    build.append("\n\n");
				JsonObject obj = element.getAsJsonObject();
				build.append(JsonObjectUtilities.toString(obj));
			} else if (element.isJsonArray()) {
				build.append("[\n");
				JsonArray subarr = element.getAsJsonArray();
				build.append(JsonObjectUtilities.toString(subarr));
				build.append("\n]");
			}
			
		}
	} catch (Exception ex) {
		System.out.println(element.toString());
		ex.printStackTrace();
	}
		return build.toString();
	}
	
	public static void printResponse(JsonObject response) {
		boolean success = response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean();
		if(success) {
			System.out.println("The process was a success");
			String message = response.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
			System.out.println(message);
			if(response.get(ClassLabelConstants.SimpleCatalogObject).isJsonNull()) {
				System.out.println("No catalog objects specified");
			} else if(response.get(ClassLabelConstants.SimpleCatalogObject).isJsonObject()) {
				JsonObject object = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
				System.out.println(JsonObjectUtilities.toString(object));
			} else {
				JsonArray object = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
				System.out.println(JsonObjectUtilities.toString(object));
			}
			
		} else {
			System.out.println("The process was not a success");
			String message = response.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
			System.out.println(message);
		}
	}
	
	public static JsonObject jsonObjectFromString(String jsonS) {
		JsonObject jsonObject = new JsonParser().parse(jsonS).getAsJsonObject();
		return jsonObject;
	}
	
	public static JsonObject jsonObjectFromFile(String path) throws IOException {
		Path fileName = Path.of(path);
		JsonObject obj = null;
		String actual = "";
		try {
			actual = Files.readString(fileName);
			obj = jsonObjectFromString(actual);
		} catch (IOException e) {
			throw new IOException("File could not be read: " + path);
		}
		return obj;
	}
	public static JsonArray jsonDifference(JsonObject originalobject, JsonObject newobject) {
	    Gson gson = new Gson();
	    Type type = new TypeToken<Map<String, Object>>(){}.getType();

	    Map<String, Object> originalobjectMap = gson.fromJson(originalobject, type);
	    Map<String, Object> newobjectMap = gson.fromJson(newobject, type);
	    JsonArray changes = new JsonArray();
	    JsonArray recordID = new JsonArray();
	    mapDifference(originalobjectMap,newobjectMap, changes, 0, recordID);
	    return changes;
	}
	public static void mapDifference(Map<String, Object> originalobjectMap, Map<String, Object> newobjectMap,
	        JsonArray changes, int level, JsonArray recordID) {
	    Set<String> originalobjectkeydiff = new HashSet<String>();
	    originalobjectkeydiff.addAll(originalobjectMap.keySet());
	       	    originalobjectkeydiff.removeAll(newobjectMap.keySet());
	    
        Set<String> newobjectdiffkeys = new HashSet<String>();
        newobjectdiffkeys.addAll(newobjectMap.keySet());
        newobjectdiffkeys.removeAll(originalobjectMap.keySet());
        newobjectdiffkeys.removeAll(originalobjectkeydiff);
        
        for(String key: originalobjectkeydiff ) {
            JsonArray newrecordid = newRecordID(recordID,level,key);
            Object left = originalobjectMap.get(key);
            addDeletedObject(left,changes,newrecordid);
        }
        for(String key: newobjectdiffkeys ) {
            JsonArray newrecordid = newRecordID(recordID,level,key);
            Object left = newobjectMap.get(key);
            addAddedOjbect(left,changes,newrecordid);
            
        }
         
        
        MapDifference<String, Object> diff = Maps.difference(newobjectMap, originalobjectMap);
        Map<String, ValueDifference<Object>> entries = diff.entriesDiffering();
	    Set<String> keys = entries.keySet();
	    
	    for(String key : keys) {
	        JsonArray newrecordid = newRecordID(recordID,level,key);
	        ValueDifference<Object> entrydifference = entries.get(key);
	        Object right = entrydifference.rightValue();
	        Object left = entrydifference.leftValue();
            if(right != null) {
                if(left != null) {
                mapDifferenceSub(key,right,left, changes, level+1,newrecordid);
                } else {
                    System.out.println(level + ":  Key: " + key + "Right side: '" + right + "'   no left element");
                }
            } else if(left != null) {
                System.out.println(level + ":  Key: " + key + "Left side: '" + left + "'   no right element");
            }
	    }
	}
	
	static JsonArray newRecordID(JsonArray recordid, int level, String key) {
	    JsonArray newrecordid = new JsonArray();
	    for(int i=0; i<recordid.size();i++) {
	        JsonObject id = recordid.get(i).getAsJsonObject();
	        JsonObject newid = id.deepCopy();
	        newrecordid.add(newid);
	    }
        JsonObject levelid = new JsonObject();
        levelid.addProperty(ClassLabelConstants.Position, level);
        levelid.addProperty(ClassLabelConstants.RecordObjectID, key);
        newrecordid.add(levelid);
	    return newrecordid;
	}
	/*
	 * This routine assumes that the new elements are at the front of the list.
	 */
	
	
    public static void mapDifference(ArrayList<Map<String, Object>> originalobjectMap, 
            ArrayList<Map<String, Object>> newobjectMap,
            JsonArray changes, int level, JsonArray recordID) {
        
        ArrayList<Integer> indiciesorig = new ArrayList<Integer>();
        ArrayList<Integer> indiciesnew = new ArrayList<Integer>();
        for(int i=0;i<originalobjectMap.size(); i++) {
            indiciesorig.add(i);
        }
        for(int i=0;i<newobjectMap.size(); i++) {
            indiciesnew.add(i);
        }

        
        findDifferencePairs(originalobjectMap, newobjectMap,
                changes,level,recordID,
                indiciesorig,indiciesnew);
        
       
         if(newobjectMap.size() > 0) {
            for(int i=0; i<newobjectMap.size(); i++) {
                String index= Integer.toString(indiciesnew.get(i));
                JsonArray newrecordid = newRecordID(recordID,level,index);
                JsonObject change = new JsonObject();
                
                Type typeOfHashMap = new TypeToken<Map<String, String>>() { }.getType();
                Gson gson = new GsonBuilder().create();
                JsonObject added = (JsonObject) gson.toJsonTree(newobjectMap.get(i), typeOfHashMap);
                change.addProperty(AnnotationObjectsLabels.identifier, ClassLabelConstants.CatalogRecordAddition);
                change.add(ClassLabelConstants.ChemConnectCompoundDataStructure, added);
                change.add("dataset:recordid", newrecordid);
                changes.add(change);
                }
            }
         if(originalobjectMap.size() > 0) {
             for(int i=0; i<originalobjectMap.size(); i++) {
                 String index= Integer.toString(indiciesorig.get(i));
                 JsonArray newrecordid = newRecordID(recordID,level,index);
                 JsonObject change = new JsonObject();
                 
                 Type typeOfHashMap = new TypeToken<Map<String, String>>() { }.getType();
                 Gson gson = new GsonBuilder().create();
                 JsonObject added = (JsonObject) gson.toJsonTree(originalobjectMap.get(i), typeOfHashMap);
                 change.addProperty(AnnotationObjectsLabels.identifier, ClassLabelConstants.CatalogRecordDeletion);
                 change.add(ClassLabelConstants.ChemConnectCompoundDataStructure, added);
                 change.add("dataset:recordid", newrecordid);
                 changes.add(change);
                 }
             }
    }
    
    public static class DifferenceTotals implements Comparable<DifferenceTotals> {
        
        public DifferenceTotals(int iorig, int inew, int tot) {
            indexoriginal = iorig;
            indexnew = inew;
            total = tot;
        }
        
        public int indexoriginal;
        public int indexnew;
        int total;
        @Override
        public int compareTo(DifferenceTotals o) {     
            return this.total - o.total;
        }
        public String toString() {
            return indexoriginal + ":" + indexnew + "  " + total + "\n";
        }
    }
    
    public static void findDifferencePairs(ArrayList<Map<String, Object>> originalobjectMap, 
            ArrayList<Map<String, Object>> newobjectMap,
            JsonArray changes, int level, JsonArray recordID,
            ArrayList<Integer> indiciesorig, ArrayList<Integer> indiciesnew) {
        ArrayList<DifferenceTotals> compairs = setUpDifferences(originalobjectMap,newobjectMap);
        while(compairs.size() > 0) {
            DifferenceTotals best = compairs.get(0);
            int iorig = best.indexoriginal;
            int inew = best.indexnew;
            int origpos = findindex(iorig,indiciesorig);
            int newpos = findindex(inew,indiciesnew);
            
            Map<String, Object> origobj = originalobjectMap.get(origpos);
            Map<String, Object> newobj = newobjectMap.get(newpos);
            
            String index = iorig + ":" + inew;
            JsonArray newrecordid = newRecordID(recordID,level,index);
            mapDifference(origobj,newobj,changes,level,newrecordid);
           
            remove(iorig,indiciesorig, originalobjectMap);
            remove(inew,indiciesnew, newobjectMap);
            remove(iorig,inew,compairs);
                    
        }

    }
    
    public static int findindex(int index, ArrayList<Integer> indicies) {
        int i=0;
        boolean notdone = true;
        int found = 0;
        while(notdone && i < indicies.size()) {
            if(index == indicies.get(i)) {
                notdone = false;
                found = i;
            }
            i++;
        }
        return found;
    }
    
    public static ArrayList<DifferenceTotals> setUpDifferences(ArrayList<Map<String, Object>> origMap, ArrayList<Map<String, Object>> newMap) {
        ArrayList<DifferenceTotals> totals = new ArrayList<DifferenceTotals>();
        for(int i=0; i< origMap.size(); i++) {
            Map<String, Object> origObj = origMap.get(i);
            for(int j=0; j<newMap.size(); j++) {
                Map<String, Object> newObj = newMap.get(j);
                
                MapDifference<String, Object> diff = Maps.difference(origObj, newObj);
                Map<String, ValueDifference<Object>> entries = diff.entriesDiffering();
                Map<String, Object> right = diff.entriesOnlyOnLeft();
                Map<String, Object> left = diff.entriesOnlyOnRight();
                int total = entries.keySet().size() + right.keySet().size() + left.keySet().size();
                
                DifferenceTotals summary = new DifferenceTotals(i,j,total);
                totals.add(summary);
            }
        }
        Collections.sort(totals);
        return totals;
    }
    
    public static void remove(int index, ArrayList<Integer> indicies, ArrayList<Map<String, Object>> maparray) {
        int i = 0;
        boolean notdone = true;
        while(notdone && i < maparray.size()) {
            if(indicies.get(i) == index) {
                indicies.remove(i);
                maparray.remove(i);
                notdone = false;
            } else {
                i++;
            }
        }
    }
    public static void remove(int iorig, int inew, ArrayList<DifferenceTotals> compair) {
        int i = 0;
        while(i < compair.size()) {
            DifferenceTotals total = compair.get(i);
            if(total.indexoriginal == iorig) {
                compair.remove(i);
            } else if(total.indexnew == inew) {
                compair.remove(i);
            } else {
                i++;
            }
        }
           }
    
    public static int findBestMatch(Map<String, Object> reference, ArrayList<Map<String, Object>> lst) {
        
        int max = reference.keySet().size();
        int best = 0;
        boolean notdone = true;
        int i=lst.size()-1;
        while(notdone) {
            if(i >= 0) {
            Map<String, Object> obj = lst.get(i);
            MapDifference<String, Object> diff = Maps.difference(reference, obj);
            Map<String, ValueDifference<Object>> entries = diff.entriesDiffering();
            Map<String, Object> right = diff.entriesOnlyOnLeft();
            Map<String, Object> left = diff.entriesOnlyOnRight();
            int total = entries.keySet().size() + right.keySet().size() + left.keySet().size();
            if(total < max) {
                max = total;
                best = i;
            }
            i--;
            } else {
                notdone = false;
            }
        }
        return best;
    }
    
    public static boolean removeMatch(Map<String, Object> reference, ArrayList<Map<String, Object>> lst,ArrayList<Integer> indicies) {
        
        boolean notdone = true;
        boolean removed = false;
        int i=0;
        while(notdone) {
            Map<String, Object> obj = lst.get(i);
            MapDifference<String, Object> diff = Maps.difference(reference, obj);
            boolean equ = diff.areEqual();
            Map<String, ValueDifference<Object>> entries = diff.entriesDiffering();
            Map<String, Object> right = diff.entriesOnlyOnLeft();
            Map<String, Object> left = diff.entriesOnlyOnRight();
            int total = entries.keySet().size() + right.keySet().size() + left.keySet().size();
            if(equ) {
                notdone = false;
                removed = true;
                lst.remove(i);
                indicies.remove(i);
            }
            i++;
            if(i>= lst.size()) {
                notdone = false;
            }
        }
        return removed;
    }
    
	/*
	static void mapDifference(ArrayList<Map<String, Object>> originalobjectMap, 
	        ArrayList<Map<String, Object>> newobjectMap,
	        JsonArray changes, int level, JsonArray recordID) {
	    int lsize = Math.max(newobjectMap.size(), originalobjectMap.size());
	    level += 1;
	    for(int i=0;i<lsize; i++) {
            int iorig = originalobjectMap.size() -i -1;
            int inew = newobjectMap.size() -i -1;
	        if(iorig >= 0) {
	            if(inew >= 0) {
	                Object originalobject = originalobjectMap.get(iorig);
	                Object newobject = newobjectMap.get(inew);
	                JsonArray newrecordid = newRecordID(recordID,level,Integer.toString(iorig));
	                mapDifferenceSub(Integer.toString(i),originalobject,newobject,changes,level+1,newrecordid);
	            } else {
	                Object originalobject = originalobjectMap.get(iorig);
	                JsonArray newrecordid = newRecordID(recordID,level,Integer.toString(iorig));
	                addAddedOjbect(originalobject,changes,newrecordid);
	            }
	        } else {
	            Object newobject = newobjectMap.get(inew);
	            JsonArray newrecordid = newRecordID(recordID,level,Integer.toString(inew));
	            addDeletedObject(newobject,changes,newrecordid);
	        }
	        
            
	    }
        
	}
	*/
	static void mapDifferenceSub(String key, Object right, Object left,
	        JsonArray changes, int level, JsonArray recordID) {
        
	    if(right instanceof String) {
	        addChangedComponent((String) right,(String) left,changes,recordID);
        } else if(right instanceof Map){
            mapDifference((Map<String, Object>) right, (Map<String, Object>) left, changes,level,recordID);
        } else if(right instanceof ArrayList) {
            mapDifference((ArrayList<Map<String, Object>>) right, (ArrayList<Map<String, Object>>) left,changes,level,recordID);
        }
	}
    static void addDeletedObject(Object right, JsonArray changes, JsonArray recordID) {
        JsonObject change = new JsonObject();
        change.add("dataset:recordid", recordID);
        
        if(right instanceof String) {
            change.addProperty(AnnotationObjectsLabels.identifier, ClassLabelConstants.CatalogComponentDeletion);
            change.addProperty(ClassLabelConstants.TransactionComponentOldValue,(String) right);
        } else {
            change.addProperty(AnnotationObjectsLabels.identifier, ClassLabelConstants.CatalogRecordDeletion);
            JsonObject jsonright = objectToJson(right);
            change.add(ClassLabelConstants.ChemConnectCompoundBase, jsonright);
        }
        changes.add(change);
    }
    static JsonObject objectToJson(Object obj) {
        GsonBuilder gsonMapBuilder = new GsonBuilder();          
        Gson gsonObject = gsonMapBuilder.create();  
        Type type = new TypeToken<Map<String, Object>>(){}.getType();
        String json = gsonObject.toJson(obj, type);
        JsonObject jsonobj = JsonObjectUtilities.jsonObjectFromString(json);
        return jsonobj;
    }
    static void addAddedOjbect(Object left, JsonArray changes, JsonArray recordID) {
        JsonObject change = new JsonObject();
        change.add("dataset:recordid", recordID);
	    
	    if(left instanceof String) {
	        change.addProperty(AnnotationObjectsLabels.identifier, ClassLabelConstants.CatalogComponentAddition);
	        change.addProperty(ClassLabelConstants.TransactionComponentNewValue,(String) left);
	    } else {
            change.addProperty(AnnotationObjectsLabels.identifier, ClassLabelConstants.CatalogRecordAddition);
            JsonObject jsonleft = objectToJson(left);
            change.add(ClassLabelConstants.ChemConnectCompoundBase, (JsonElement) jsonleft);
	    }
        changes.add(change);
	}
	
	static void addChangedComponent(String right, String left, JsonArray changes, JsonArray recordID) {
        JsonObject change = new JsonObject();
        change.addProperty(AnnotationObjectsLabels.identifier, ClassLabelConstants.CatalogComponentModification);
        change.addProperty(ClassLabelConstants.TransactionComponentOldValue,(String) right);
        change.addProperty(ClassLabelConstants.TransactionComponentNewValue,(String) left);
        change.add("dataset:recordid", recordID);
        changes.add(change);

	}
	public static void replaceIdentifiersWithPropertyValuePairs(JsonObject input, Set<String> classList) {
		JsonObject propsJsonObject = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
		input.add(ClassLabelConstants.SetOfPropertyValueQueryPairs, propsJsonObject);
		JsonArray properties = propsJsonObject.get(ClassLabelConstants.PropertyValueQueryPair).getAsJsonArray();
		for(String classnameString : classList) {
			String idString = DatasetOntologyParseBase.getAnnotationObject(classnameString, AnnotationObjectsLabels.identifier);
			String altlabelString = DatasetOntologyParseBase.getAnnotationObject(classnameString, AnnotationObjectsLabels.altlabel);
			if (input.get(idString) != null) {
				String valueString = input.get(idString).getAsString();
				JsonObject property = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
				
				property.addProperty(ClassLabelConstants.DatabaseObjectType, classnameString);
				property.addProperty(ClassLabelConstants.ShortStringKey, valueString);
				properties.add(property);
				input.remove(idString);
			}
		}

	}

}
