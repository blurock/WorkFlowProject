package info.esblurock.reaction.core.ontology.base;

public abstract class AlternativeEntry {
	
	public String getDataCubeURL() {
		return "http://purl.org/linked-data/cube";
	}
	public String getSSNURL() {
		return "http://www.w3.org/ns/ssn/";
	}
	public String getVcardURL() {
		return "http://www.w3.org/2006/vcard/ns";
	}
	public String getDCatURL() {
		return "http://www.w3.org/ns/dcat";
	}	
	public String getDctermsURL() {
		return "http://purl.org/dc/terms/";
	}
	public String getDCITypeURL() {
		return "http://purl.org/dc/dcmitype";
	}
	public String getProvoURL() {
		return "http://www.w3.org/ns/prov-o-20130430";
	}
	public String getOrgURL() {
		return "http://www.w3.org/ns/org#";
	}
	public String getFoafURL() {
		return "http://xmlns.com/foaf/0.1/";
	}
	public String getSKOSURL() {
        return "http://www.w3.org/2004/02/skos/core";
        //return "https://www.w3.org/2009/08/skos-reference/skos.rdf";
	}
	public String getDataCiteURL() {
		return "http://purl.org/spar/datacite/";
	}
	public String getGEOURL() {
		return "http://www.w3.org/2003/01/geo/wgs84_pos";
	}
	public String getDcTermsURL() {
		return "http://purl.org/dc/terms/";
	}
	
	public String getOwlURL() {
		return "http://www.w3.org/2002/07/owl#";
	}
	abstract public String getOwlLocal();
	public String getRDFSURL() {
		return "http://www.w3.org/2000/01/rdf-schema";
	}
	abstract public String getRDFSLocal();
	public String getXMLSchema() {
		return "http://www.w3.org/2001/XMLSchema";
	}
	
	public String getQUDTUnitPrefix() {
		return "unit:";
	}
	public String getPhysicsUnit() {
		return "http://qudt.org/2.0/vocab/VOCAB_QUDT-UNITS-PHYSICAL-CHEMISTRY-AND-MOLECULAR-PHYSICS-v2.0.ttl";
	}
	abstract public String getPhysicsUnitLocal();
	public String getPhysicsUnitPrefix() {
		return "unit:";
	}
    public String getVaem() {
        return "http://www.linkedmodel.org/schema/vaem";
    }
    public String getShaclURL() {
        return "http://www.w3.org/ns/shacl#";
    }
    public String getFunctionsURL() {
        return "http://qudt.org/2.1/schema/extensions/functions";
    }
    public String getplURL() {
        return "http://spinrdf.org/spl";
    }

	
    public String getQUDTQudt() {
        return "http://qudt.org/2.1/schema/qudt";
    }
    public String getQUDTDatatype() {
        return "http://qudt.org/2.1/schema/datatype";
    }
    public String getQUDTUnit() {
        return "http://qudt.org/2.1/vocab/unit";
    }
    public String getQUDTQuantitykind() {
        return "http://qudt.org/2.1/vocab/quantitykind";
    }
    public String getQUDTDimensionvector() {
        return "http://qudt.org/2.1/vocab/dimensionvector";
    }
    public String getQUDTConstant() {
        return "http://qudt.org/2.1/vocab/constant";
    }
    public String getQUDTSou() {
        return "http://qudt.org/2.1/vocab/sou";
    }
    public String getQUDTSoqk() {
        return "http://qudt.org/2.1/vocab/soqk";
    }
    public String getPrefixURL() {
        return "http://qudt.org/2.1/vocab/prefix";
    }
    public String getQUDTFacadeURL() {
        return "http://qudt.org/2.1/schema/facade/qudt";
    }
	
    public String getQUDTShacloverlay() {
        return "http://qudt.org/2.1/schema/shacl/overlay/qudt";
    }
    
	
    public String getQUDTDtype() {
        return "http://www.linkedmodel.org/schema/dtype";
    }
	
	
	
	
	public String getQUDTQuantity() {
		//return "http://data.nasa.gov/qudt/owl/quantity";
		return "http://data.qudt.org/qudt/owl/1.0.0/quantity.owl";
	}
	abstract public String getQUDTQuantityLocal();

	public String getQUDTOwl() {
		return "http://data.qudt.org/qudt/owl/1.0.0/qudt.owl";
	}
	abstract public String getQUDTOwlLocal();
	
	public String getQUDTDimension() {
		return "http://data.qudt.org/qudt/owl/1.0.0/dimension.owl";
	}
	abstract public String getQUDTDimensionLocal();
	public String getElements() {
		return "http://purl.org/dc/elements/1.1/";
	}
	abstract public String getElementsLocal();
	public String getSOSA() {
		return "http://www.w3.org/ns/sosa/";
	}
	abstract public String getSOSALocal();
}
