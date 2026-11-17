** Goal
To create an administration panel to manage, create, modify and delete, through services, the data in the database and lists used by the interface.
Modularlize the services as needed. In some (or all) they are meant to be backend/background tasks.

Have separate buttons on the UI for each type of service and list, with the possibility to do a set of similar tasks. 
The UI should be divided into a top-level bar of buttons, one for each type of object (or task).
Each button will bring up a panel for that object type. 

These services are done in an administration task panel because some of the services involve going through the entire object database and classifications (a question, is there a time limit on how long a service can run?).

Other services will be added as needed.

Modularization is the key to the implementation. 

** Verify Database Integrity

Checking that the names and IDs are unique and consistent for each of the sets of objects.  In the interface, the object (for example, molecule, substructures, reaction patterns, etc) which should be verified will be chosen.


1. Go through all Firestore objects (/users/<user>/<objecttype>/records/xxx), collect all names and IDs, check for missing ids, duplicate names and Ids.
2. Go thorugh all Firestore classification objects, (/users/<user>/<objecttype>/classifications/xxx), and  collect all names and IDs from the 'Keys' array, check for missing ids, duplicate names and Ids.
3. Check that the names and IDs from the objects are the same as the names and IDs from the classification. One way to do this is to alphabetically sort both lists and compare them.

The results of these tests will be shown in another tab. The results should indicate if there are any problems and how to fix them. A fix for duplicates could be to allow the user the option to delete one. A fix for duplicate names could be to rename. In the implementation plan you can suggest ways to fix each type. There are services that already exist to do some of this work, for example delete object. The service to change should also insure that both the object and the classification entry are modified and consistent.

** Create Lists of objects

For each type of object :
1. Create the list of these objects that are used in the 'Explore and Inspect Data' lists. The service is the same as that called by the 'Refresh Catalog List'

The lists created here are used in various places in the interface and should be made available to be called from this interface. How they are stored and organized could be part of the implementation plan. 

Molecules:
1. Create a simple list of molecules

Substructures:
1. Group the substructures by similar types (as was done with the reaction patterns) for example: 
under .c(X)(X)c(X) would be 
.c(h)(h)co(h), .c(r)(h)co(h), .c(r)(r)co(h), 
.c(h)(h)co(r), .c(r)(h)co(r), .c(r)(r)co(r)
2. Create a list of substructures that are molecules. This is simply done by the intersection of the molecule list and the substructure list.
3. Create a map/list of substructure IDs and pair the substructure name and ID and the group (this will be used in creating the reaction pattern hierarchy). 


Reaction patterns
1. The list as created by 'Refresh Catalog List' with the grouping according to name.
2. Group the reaction patterns according to substructures
a: Top level Reactant or Product.
b: For non-molecule substructures (i.e. not in list 2 under substructures), Group the reaction patterns by the substructures groups (as created by list 1 of substructures). An efficient algorithm to this could use the list created by list 3 of substructures.

Mechanism Path:
1. Create a list of all mechanism paths grouped by common name. The common name is that in front of the version: For example BasicLowTemperatureV1, BasicLowTemperatureV2, etc. all go under the heading BasicLowTemperature. For each group, sort the versions by number. 

Mechanisms:

1. Sort them as in 'Refresh Catalog List' (i.e. by target name).




