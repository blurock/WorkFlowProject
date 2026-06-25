*** Description
This gives general instructions on how to display an object in the user interface. This is meant to supplement the display of primitives in /Users/edwardblurock/git/WorkFlowProject/manager-frontend/src/app/features/catalog/primitives and the various components within it.

*** General Rules
1. The identifier is used to determine the class of the object.
2. If the class name is found in the interface directory, then the corresponding interface file should be used to display the object. 
3. If the class name is not found in the interface directory, then the object should be displayed as a simple object (dynamic-primitive: /Users/edwardblurock/git/WorkFlowProject/manager-frontend/src/app/features/catalog/primitives/dynamic-primitive/dynamic-primitive.component.ts). 
4. At the top level there will be a distinction between displaying a complete firebase catalog object and an intermediate JSON object. 
5. A complete firebase catalog object is displayed using MinimumDatabaseObjectStructure to display the common properties of all objects, and then the specific properties of the object. 
6. If the object is a simple object (a string or a number or a boolean or an array of strings or numbers or booleans) then the dynamic-primitives should be used. 
If the object is a JSON object, then the class is determined and it is determined whether there is a corresponding component to be used for displaying it. 

*** Interface directory

There is a directory which links the class name to the interface file. It can be found at /Users/edwardblurock/git/WorkFlowProject/manager-frontend/src/app/features/catalog/interfaces.

*** primitive directory

The directory /Users/edwardblurock/git/WorkFlowProject/manager-frontend/src/app/features/catalog/primitives should be used to display simple objects.

*** Getting information about the object from the backend
Using /Users/edwardblurock/git/WorkFlowProject/manager-frontend/src/app/features/catalog/primitives/showcase/dynamic-primitive-test.ts as a reference.

private ontologyService = inject(OntologyService);

  ngOnInit() {
    this.ontologyService.getUITemplate(this.datatypeKey).subscribe({
      next: (struct) => {
        this.structure = struct["dataobject"];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.message || 'Unknown error';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }


*** Top level
The input at the top level is the classname and the JSON object to be displayed.

There are two top level routines:
1. The first assumes that the JSON object is a firebase object. This uses MinimumDatabaseObjectStructure to display the common properties of all objects, and then call the general JSON object routine to process the rest of the JSON parameters. 
2. The second assumes a general JSON object (not a firebase object). 

At the top level, call the getUITemplate service to get the annotations describing the elements of the current JSON object. 



*** General Procedure for general JSON object:
1. The parameters of the current object are looped through, with the identifier determine the class of the object:
2. For each parameter:
 2a. Determine the class using the identifer
 2b: If the class name is found in the interface directory, then the corresponding interface file should be used to display the object. 
 2c: If the class name is not found in the interface directory, then:
  2c.1. if the object is a primitive, then the object should be displayed as a simple object (dynamic-primitive: /Users/edwardblurock/git/WorkFlowProject/manager-frontend/src/app/features/catalog/primitives/dynamic-primitive/dynamic-primitive.component.ts). 
  2c.2. if the object is a JSON object, then recursively go through its parameters.
