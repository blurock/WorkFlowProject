package info.esblurock.reaction.core.ontology.base;

import java.net.URL;

public class AlternativeEntryWithAppFiles extends AlternativeEntry {

    public String getSKOSLocal() {
        String path = "info/esblurock/reaction/core/ontology/base/resources/skos.rdf";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
    public String getVaemLocal() {
        String path = "info/esblurock/reaction/core/ontology/base/resources/vaem.ttl";        
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
	public String getDataCubleLocal() {
		String path = "file:info/esblurock/reaction/core/ontology/base/resources/cube.ttl";
		URL url = getClass().getClassLoader().getResource(path);
		return url.toString();
	}
	public String getVcardLocal() {
		String path = "info/esblurock/reaction/core/ontology/base/resources/vcard.ttl";
		URL url = getClass().getClassLoader().getResource(path);
		return url.toString();
	}
	public String getDCatLocal() {
		String path = "info/esblurock/reaction/core/ontology/base/resources/dcat.ttl";
		URL url = getClass().getClassLoader().getResource(path);
		return url.toString();
	}
	public String getElementsLocal() {
		String path = "file:info/esblurock/reaction/core/ontology/base/resources/dcelements.ttl";
		URL url = getClass().getClassLoader().getResource(path);
		return url.toString();
	}
	public String getSSNLocal() {
		String path = "info/esblurock/reaction/core/ontology/base/resources/ssn.ttl";
		URL url = getClass().getClassLoader().getResource(path);
		return url.toString();
	}
    public String getDcTermsLocal() {
        String path = "info/esblurock/reaction/core/ontology/base/resources/dcterms.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
    public String getSplLocal() {
        String path = "info/esblurock/reaction/core/ontology/base/resources/spl.owl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
	public String getDCITypeLocal() {
		return "file:info/esblurock/reaction/core/ontology/base/resources/dcterms.ttl";
	}
	public String getProvoLocal() {
		return "info/esblurock/reaction/core/ontology/base/resources/prov-o.ttl";
	}
	public String getOrgLocal() {
		return "file:info/esblurock/reaction/core/ontology/base/resources/org.ttl";
	}
	public String getFoafLocal() {
		String path = "file:info/esblurock/reaction/core/ontology/base/resources/foaf.rdf";
		URL url = getClass().getClassLoader().getResource(path);
		return url.toString();
	}
    public String getShaclLocal() {
        String path = "info/esblurock/reaction/core/ontology/base/resources/shacl.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }

	@Override
	public String getRDFSLocal() {
		return "info/esblurock/reaction/ontology/rdf-schema.owl";
	}
	public String getOwlLocal() {
		return null;
	}

	public String getRDFLocal() {
		return "info/esblurock/core/ontologybase/resources/22-rdf-syntax-ns.owl";
	}

	public String getDataCiteLocal() {
		return "info/esblurock/core/ontologybase/resources";
	}
	public String getGEOLocal() {
		return "info/esblurock/core/ontologybase/resources/wgs84_pos.rdf";
	}

	
	
	
    public String getQUDTConstantLocal() {
        String path = "resources/localcopyV21/constant.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
    public String getQUDTDatatypeLocal() {
        String path = "resources/localcopyV21/datatype.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
    public String getQUDTDimensionvectorLocal() {
        String path = "resources/localcopyV21/dimensionvector.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
    public String getQUDTQuantitykindLocal() {
        String path = "resources/localcopyV21/quantitykind.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
    public String getQUDTSoqkLocal() {
        String path = "resources/localcopyV21/soqk.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
    public String getQUDTSouLocal() {
        String path = "resources/localcopyV21/sou.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
    public String getQUDTUnitLocal() {
        String path = "resources/localcopyV21/unit.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
    public String getFunctionsLocal() {
        String path = "resources/localcopyV21/functions.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
	
	
    public String getQUDTQudtLocal() {
        String path = "resources/localcopyV21/qudtshacl.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
    public String getQUDTDtypeLocal() {
        String path = "resources/localcopyV21/unit.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
    public String getQUDTShacloverlayLocal() {
        String path = "resources/localcopyV21/shacloverlay.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
    public String getPrefixLocal() {
        String path = "resources/localcopyV21/shacloverlay.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
    public String getQUDTFacadeLocal() {
        String path = "resources/localcopyV21/facade.ttl";
        URL url = getClass().getClassLoader().getResource(path);
        return url.toString();
    }
	
	
	
	public String getPhysicsUnitLocal() {
		String path = "info/esblurock/core/ontologybase/resources/VOCAB_QUDT-UNITS-PHYSICAL-CHEMISTRY-AND-MOLECULAR-PHYSICS-v2.0.ttl";
		URL url = getClass().getClassLoader().getResource(path);
		return url.toString();
	}

	@Override
	public String getQUDTQuantityLocal() {
		String path = "info/esblurock/core/ontologybase/resources/quantity.owl";
		URL url = getClass().getClassLoader().getResource(path);
		return url.toString();
	}
	
	public String getQUDTOwlLocal() {
		String path = "info/esblurock/core/ontologybase/resources/qudt.owl";
		URL url = getClass().getClassLoader().getResource(path);
		return url.toString();
		
	}

	@Override
	public String getQUDTDimensionLocal() {
		String path = "info/esblurock/core/ontologybase/resources/dimension.owl";
		URL url = getClass().getClassLoader().getResource(path);
		return url.toString();
	}
	public String getQUDTUnitOwlLocal() {
		String path = "info/esblurock/core/ontologybase/resources/unit.owl";
		URL url = getClass().getClassLoader().getResource(path);
		return url.toString();
	}
	public String getSOSALocal() {
		String path = "resources/sosa.owl";
		URL url = getClass().getClassLoader().getResource(path);
		return url.toString();
	}
	
}
