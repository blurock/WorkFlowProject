*** Goal
'Graphical Molecule Input': The goal of this interface is to input a molecule or substructure with a ketcher dialog. 

*** Dialog Panels
1. Left Panel:  This is a ketcher panel. You can use the ketcher panel used with the Generate Reaction Pattern as a guide to what is necessary. 
2. Right Panel: The will be a set of panels that define the molecule information and the status of putting the molecule in the database. 

*** Panel 1: Molecule/Substructure
The first line of this panel selects whether the ketcher drawing is a "Reactant", "Product", or "Substructure".  A radio button is the obvious way to do this. 
The second line is the name of the structure. Some panels are dependent on whether the structure is a molecule or substructure.

*** Panel 2: Molecule Alternative Name Information
This panel is only used for molecules
This panel is a table with two columns: Type and Name.
1. Type: The type column is a pulldown list of types: CHEMKIN, Short, Formula
2. Name: This is the name of the molecule of that type.

*** Panel 3: Thermodynamic Information
This panel is only used for molecules. 
The top line of this panel has a pulldown that selects the thermodynamic method. Options are. 
1. NASA
2. Benson Table

*** Panel 3a: NASA Thermodynamic Information
This panel is only used for NASA thermodynamic data.
This is a text block iwith Courier font for entering NASA data in the same format as CHEMKIN files.

*** Panel 3b: Benson Thermodynamic Information
This panel is only used for Benson thermodynamic data.
The top line will have three fields:
1. the unit type;
      a: Calorie: Thermodynamic units based on Calories
      b. Joule: Thermodynamic units based on Joules
2. The Enthalpy value
3. The Entropy value
The next part is a table with two columns:  Temperature and Value
The table is initialized with standard temperature values: 298,400,500,600,800,1000,1500
One should be able to add or delete temperature rows.  

*** Action Panel
This has the buttons to perform the steps needed to put the molecule into the database.
The first step is to check if the molecule is in the database.
If the molecule is not in the database, then a second button appears which stores the molecule in the database. 

***Panel 5: Execution Log panel
This panel displays log information about the process of putting the molecule into the database. 

***Panel 6: Molecule information panel. 
This is information about the molecule. It is several panels (you can use the Molecule Display as a guide for the layout as how to parse the output information). t
These come from the 'Calculations' command in the input commands, this can be done with the existence check and with the Output command in the input. 
1. Electronic Properties & Shells
2. Atomic Radii, Electronegativity & Charge Factors
3. Molecule in SDF form






