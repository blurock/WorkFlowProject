*** Goal

The goal is to draw a simple generic reaction pattern in ketcher and then use this to see if that reaction pattern matches anything in the database. It is a way to search for reaction patterns.

This should be a reusable component that can be used in different contexts. The main usage will be in the creation of a mechanism pathway. 

*** Reaction Center encoding

The key to this is to add a property that encodes the reactive center (meaning the bonds that change betweenn reactants and products) for each reaction pattern. This encoding is stored as a property in the reaction pattern. The encoded string is a canonical description of the reaction center that can be searched for in Firebase.

The encoding is done as follows:
1. Identify the bonds that change: This is where the '4' is found in the correspondence description. 
2. In the reactants the changes are bond breaking and in the products the bond making.
3. For each bond that changes:
   a. Identify the atoms connected by this bond.
   b. For each atom identify three properties. 
         i: The type (T) of atom (C, O, etc)
         ii: A list of the types(B) of bonds, single (S), double(D), triple(T)
         iii: Whether the valence (V) is a Radical (R) or nonradical (N)
    c. For each atom this informaiton is encoded as a string.  TVBBB
    d. The two bond descriptions are ordered in alphbetical order and concatenated: TVBBBTVBBB
    e. The bond breakage bond is appended with a B and the formation appended with a F:  B-TVBBBTVBBB-F-TVBBBTVBBB.  
    f. The reaction center is then encoded in a property of the reaction pattern as follows:
       i. "reactionCenterBonds": "B-TVBBBTVBBB-F-TVBBBTVBBB"
    This is what is used to identify the reaction pattern. Every reaction pattern has such an encoding.

*** Sequence of events

1. The user draws a simple representation of a reaction pattern in ketcher. 
2. The bond changes are noted and the reaction center is
3. This encoding is used to identify the reaction patterns with the same reactive center with a search of the Firestore database of reaction patterns.
4. given the list of candidate reaction patterns:
     a. The ketcher reactant structure i checked to see if it is a substructure of one of the reactants in the reaction pattern.
     b. If a reactant is matched, then then the ketcher product is compared to see if it a substructure of the one  of the eaction pattern products.
     c. If both the reactant and product are substructures, then the reaction pattern is considered a match.
     d. The matching reaction patterns are then displayed as a set of collapsible lines with the reaction pattern name. If the eye is clicked, then the reaction pattern will be displayed in a ketcher panel. 
     e. On this line is also a check box. 
5. The will be a button that says 'Add Selected Reaction Patterns'. Where and how the selected patterns are added depends on what the user is doing.
     a. If the user is creating a MechanismPathway, then the selected patterns will be added to the MechanismPathway at the given step. 
     
**** Use in Mechanism Pathway Creator

When the button 'Select Whole Classes / Patterns' is selected, a popup window with two tabs will appear.
1. Tab 1 (From List) is for finding patterns from a list (as is currently done)
2. Tab 2 (From Pattern) is for finding patterns from a pattern drawn in ketcher. (See the first section for details).



  
    