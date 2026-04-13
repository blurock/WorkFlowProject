---
name: Accessing Object Parameters
description: Every object has a one-to-one correspondence to an ontology class.  This class defines the properties of the object.
---

# My Skill

*** Definitions ***
Ontology Class: A class in the ontology that defines the properties of an object. A typical class name is of the form namespace:ClassName.  The namespace is a short string that identifies the ontology (usually dataset:), and the ClassName is the name of the class. The ontology class corresponds to JSON objects in the frontend or the backend. 
Ontology Class information: Every ontology class has a standard set of information:
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": This is key used to access this object when used within a class. It is call the identifier. The identifier corresponds to the key used to access the object in the frontend and backend.
        "rdfs:label": A short natural language description of the object. Used in the GUI to display the object in a human readable format, for example in a pull-down list.
        "rdfs:comment": This is a longer description of the object in natural language. It is used to provide additional information about the object.
Object Parameter: Each parameter also corresponds to an ontology class. It has the same properties as an ontology class. To access an object parameter, the identifier of the class is used as the key in the JSON object.

*** code to access object parameters in the frontend ***
In the frontend, the `manager-frontend/src/app/components/constants/ontologyconstants.ts` is a class that contains the identifier for each class. For example 
       public JThermodynamicsStructureName = 'dataset:structurename';
       where the class is 'dataset:JThermodynamicsStructureName' and the corresponding identifier is 'dataset:structurename'.
To access the object parameters in the frontend, use the following code:
     const name = json[this.ontology.JThermodynamicsStructureName];

*** code to access object parameters in the backend ***
In the backend, the `info.esblurock.reaction.core.ontology.base. 
is a class that contains the identifier for each class. For example 
       public static final String JThermodynamicsStructureName = "dataset:structurename";
       where the class is 'dataset:JThermodynamicsStructureName' and the corresponding identifier is 'dataset:structurename'.
To access the object parameters in the backend, use the following code:
     json.get(OntologyConstants.JThermodynamicsStructureName).getAsString();

*** Related Skills ***
OntologyConstants: 
the definitions of the `manager-frontend/src/app/components/constants/ontologyconstants.ts` and the 'ChemConnectCoreOntologyBase/src/main/java/info/esblurock/reaction/core/ontology/base/constants/ClassLabelConstants.java`

## When to use this skill

** frontend **
-- Whenever a parameter is accessed, use the ontologyconstants.ts to get the identifier for the parameter.

** backend **
-- Whenever a parameter is accessed, use the OntologyConstants class to get the identifier for the parameter.

If a parameter is to be added to the code, there must first be a correspond class in the ontology.
The identifier, for example in quotes "dataset:structurename" is never directly used in the code. 

## How to use it

1. Determine the class of the object
2. Find the class name (without namespace) in the ontology constants
3. The class name is the static variable whose value is the identifier for the object parameter.
4. Use use the 'ontologyclass.ClassName' to access the object parameter.

*** frontend ***
this.ontology.JThermodynamicsStructureName

*** backend ***
OntologyConstants.JThermodynamicsStructureName