package info.esblurock.reaction.core.ontology.base.dataset;

import static org.junit.Assert.*;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestCreateTemplateWithAnnotations {

    @Test
    public void test() {
        System.out.println("---------------------------------------------------------------------");
        String classname1 = "dataset:ThermodynamicBensonRuleDefinitionDataSet";
        JsonObject obj = CreateDocumentTemplate.createTemplate("dataset:ThermodynamicBensonRuleDefinitionDataSet");
        System.out.println(JsonObjectUtilities.toString(obj));
        System.out.println(classname1);
        JsonObject objanno1 = CreateDocumentTemplate.createTemplateWithAnnotations(classname1);
        //JsonObject ans = objanno1.get("dataset:simpcatobj").getAsJsonObject();
        JsonObject catalog = objanno1.get("dataobject").getAsJsonObject();
        List<String> keys = catalog.entrySet()
                .stream()
                .map(i -> i.getKey())
                .collect(Collectors.toCollection(ArrayList::new));

            keys.forEach(System.out::println);
        JsonObject anno = objanno1.get("annotations").getAsJsonObject();
        //System.out.println(anno.keySet());
        System.out.println(JsonObjectUtilities.toString(anno.get("dataset:HttpAddressInformationType").getAsJsonObject()));
        System.out.println("---------------------------------------------------------------------");
    }

}
