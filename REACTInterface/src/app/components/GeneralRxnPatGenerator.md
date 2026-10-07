*** Goal
To use Ketcher dialog to create a reaction pattern template that can be translated to a class of reaction patterns in the database. 

*** Dialog Panels

There will be two panels in the dialog.
1. Left Panel: the Ketcher drawing area for creating the reaction template.
2. Right Panel: the reaction class panel for defining the reaction class.

*** Ketcher Drawing Panel

Within the ketcher dialog one draws a reaction template.

1. All the atoms should have atom numbers.
2. Each atom should have a full valence (this has to be insured by the user).
3. There will be 'general' atoms with the prefix R, such as R1, R2, etc.
4. There will be specific atoms, which are specified by their atomic symbol.
5. The reaction arrows will be drawn from the product side to the reactant side.

*** Template Validation
1. Read the reaction template from the ketcher dialog.
2. Validate the reaction template.
3. Validate the atom numbers.
4. Validate the reactants and product atoms and atom counts. The number of atoms types should be conserved in the reaction. For each atom in the reactants there should be exactly one atom in the product of the same atomic type.
5. Validate the general atoms.
6. Validate the specific atoms.
7. Validate the reaction arrows.

*** Template to Reaction Class Translator (left panel)

The ketcher panel will be used as the basis of the information in the left panel. 

*** 1. Button panel
Buttons: 
'Validate Template': ValidateRxnPatternDialogTemplate: check if atoms in reactants == atoms in products in terms of atomic number.
'Assign Atoms', : FillInCorrespondences 
'Generate Class' : GeerateRxnClassFromTemplate: 
'Check Database' : CheckRxnClass: Now that a complete reaction class has been generated, check if it is already in the database in the same way as was done in reading in a rxn pattern file.
'Store Class' : StoreRxnClassFromTemplate: Store the reaction class in the database as is done with reading a file. This is only enabled if it passes the previous tests


 *** Class Name Panel

 The class name panel will have two fields on two lines
The first is the Root name (Root) of the template. 
The second line is a generated class name from the template, using the root with the generic substitution attached:
Root-Groupings

For example Root-(XXX)(XX)(XX)
Grouping in the parenthesis are the R groups from the 'Table of R Groupings' table (see below).
Each X will be substituted by the permutaion of the R group assignments in the 'Table of R Groupings' table for that group. Each reaction pattern will have the X's substituted: for example the first can be Root-(hhh)(hh)(hh) and the last will be Root-(rrr)(rr)(rr).

*** Reaction Constants

Two lines will be displayed for the Forward and Reverse reaction constants, the ArrheniusForm property. These numbers will be the default values in the reaction pattern. The information should fill in these structures:
From /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/struct/chemdb/mech.def 
   2 The Forward Rate Constant
     ArrheniusFormValue Forward Pointer Create
   3 Forward Rate Reference
     STRING ForwardReference Pointer Create
   4 The Reverse Rate Constant
     ArrheniusFormValue Reverse Pointer Create
   5 Reverse Rate Reference
     STRING ReverseReference Pointer Create

from /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/struct/property/prptypes.def
0 PropertyTypes
     ArrheniusFormValue 81 arrheniusformvalues
        0 The Arrhenius Constant
          FLOAT Aconstant Create
        1 The Activation Energy
          FLOAT Energy Create
        2 The Temperature Exponent
          FLOAT TempExp Create
        3 The Symmetry Factor
          FLOAT SymmetryFactor Create
        DONE

**** Correspondence Table and bond breaking / formation ****

This table is filled in by the FillInCorrespondences routine when the 'Assign Atoms' button is pressed.
In the first column, each line corresponds to an atom number of an atom in the reactant part of the template. 
The second column is the Atom type, C, O H, R1, R2, etc. 

Each item in the third column is a dropdown list of the atoms in the product molecule which has the same atom type (i.e. atomic number like C, O H, ) or is the same type of general atom (i.e. R1, R2, etc.).

This table is used to fill in the structure (from /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/struct/chemdb/rxn.def)
     RxnAtomCorrespondence 61 rxnatomcorr
        0 The Product Atom
          RxnAtom Product Pointer Create
        1 The Reactant Atom
          RxnAtom Reactant Pointer Create
        2 The Molecule Position in the set of Reactants
          INT ReactantPosition Create
        3 The Molecule Position in the set of Products
          INT ProductPosition Create
          DONE


The next table is the bond changes. :
The table has three columns specifying that the bond between X and Y in molecule Z is broken::
1. Molecule number Z: In the order of appearance in the list of substructures (reactants come first and products last)
2. bond Break Atom X
3. Bond breack Atom Y
X and Y are the atom numbers in the ketcher drawing. 
Each row fills in RxnBond (from /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/struct/chemdb/rxn.def). the correspondences are used to translate the ketcher values to the RxnAtomCorrespondence Atom. The type is 4 for reactants and 104 for products.
     RxnBond 62 rxnbond
        0 Atom Number 1
          RxnAtomCorrespondence Atom1 Pointer Create
        1 Atom Number 2
          RxnAtomCorrespondence Atom2 Pointer Create
        2 The type of bond change
          INT Type Create
        DONE

From /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/struct/chemdb/rxn.def
RxnCorrespondenceSet 62 rxncorrset
        0 The Number of Correspondences
          INT NumberOfCorrs Create
        1 The Correspondences
          RxnAtomCorrespondence Corrs Pointer Create Array=NumberOfCorrs
        2 The Set of Bond Changes
          RxnBondChanges BondChanges Pointer Create
        3 The Unmatched Reactant Atoms
          RxnUnMatchedSet UnMatched Pointer Create
        DONE
There should be zero unmatched atoms (otherwise an error)

*** Table of R Groupings

This is also filled in by the FillInCorrespondences routine when the 'Assign Atoms' button is pressed.

Each line will be a group of comma delimited R atom numbers. These represent a group. The initial content of this table is generated by grouping all R atoms together that are attached to the same specific atom. For example, C(R1)(R2)(R3)-C(R4)(R4)=C(R5)(R6) would produce a table with three rows
1. R1, R2, R3
2. R4, R4
3. R5, R6
The second column of this table will be the group assignments. The default is R, H to signify that each R# can be either an R or an H. The user can change the group assignments to be whatever they want. The R atoms can be grouped together by any criteria.

The group assignments are used to form all possible combinations. for example if there are three R atoms in the first group, R1, R2, and R3, and the assignment possibilities  are R, H then there will be 6 combinations 
1. (hhh)
2. (rhh)
3. (hrh)
4. (hhr)
5. (rrh) 
6. (rrr)


*** Substructure Panel

DefineSubstructuresFromTemplate: This is the first task of the GeerateRxnClassFromTemplate routine when the 'Generate Class' button is pressed. These are the set of substructures needed to define the class. When this is done, all the substructures will have names:.

The names will be generated using the patterns, for example for the template C(R1)(R2)(R3)-C(R4)(R4)=C(R5)(R6), the first substructure will be c(rhh)c(hh)=c(hh). There will be one substructure per line and when the eye icon is printed, the molfile appears.

*** Reaction Pattern List Panel

Note that the correspondence and bond changes are the same for all reaction patterns.
However, the 'Reaction Constants' listed above are just defaults, and can be changed. So there is a 'Reaction Constants' panel for each of the reaction patterns.

After the substructures are defined with DefineSubstructuresFromTemplate, the GeerateRxnClassFromTemplate routine will generate a list of reaction patterns. .The name of each pattern uses the naming information in the  
'Class Name Panel' and the 'Table of R Groupings'. Every combination of assignments from the 'Table of R Groupings' table will be made.
This panel will display the reaction pattern in lst form. 
Each reaction pattern will be a line with the name and an eye icon,. When the eye icon is clicked, the molfile appears.

The reactions are generated and put into the ReactionSet structure. This is important, because there is a molfile which works for the ketcher and the 'other' molfile which is used by the read routines. 

For example the template: Root-C(XXX)(XX)(XX) with the X groupings table will produce 3!x2!x2! = 24 reaction patterns. For example the first will be Root-(hhh)(hh)(hh), the second will be Root-(rhh)(hh)(hh) and the last will be Root-(rrr)(rr)(rr).
