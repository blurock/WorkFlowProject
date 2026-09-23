*** Goal 
Create a set of functions and commands that first check the format of the reactions and reaction patterns to be read in, second check to see if they already exist in the databasae and third read and store the checked reactions

The user (or interface) is responsible to do first the format check, then the existence check and finally the read and store. the format check just reads the file. the existence check reads the file and then checks for existence and finally the store operation reads the file and then stores the reaction or reaction pattern. 

Reactions and reaction patterns should each have their own commands for FormatCheck, ExistenceCheck and for Store

*** Format Check
For both reaction patterns and reactions, they are read from a file and put into ReactionInfo. This set of routines already exist. However there should be a FormatCheck command for both reactions and reaction patterns which is based on the existing routines.  This command will check to see if the reaction or reaction pattern is valid and if not will report the errors. 

*** Database Existence Check: General
After a reaction or reaction pattern has been read in and checked for format, it should be checked to see if it already exists in the database.  The database should be checked for both reactions and reaction patterns.  This check should be done by a routine that can be called from the command line or from the API. 

*** Database Existence Check: Reaction Patterns
For reaction patterns, a check is made using classifications. There should be two levels of equivalence. The first level is that all the substructures (using the name) in the reaction patterns are the same for the read in and the database reaction pattern.  The second level is that the reaction pattern is equivalent using the checks for bond changes (this routine already exists). The output is a table with three columns. The first is the reaction pattern name. the next has the reaction pattern that is equivalent using the first level. The third has say Exact Match when the reaction pattern matached as the second level.

*** Database Existence Check: General: Reaction Input as SDF $RXN molfile form.

First the molecules (reactants and products) are read in from the $RXN $MOL files.  Each molecule is then checked for existence in the database, using the usual check for molecules in the database using the structure of the molecule. 
If all molecules exist in the database then the reaction is checked for existence in the database. A reaction is equivalent when all the reactant molecules are the same and all the product molecule are the same as found in the database.  If a molecule does not exist in the database, then the reaction is new.

*** Database Existence Check: General: Reaction as ASCII (*.lst)

In this format, the molecules names are given for the reactants and products. These should already exist in the database. If they don't, then it is a format error. If they do exist, then the reaction is equivalent to the database reaction when the reactants and products (using just the names) match exactly.


*** Read and Store Reactions and Reaction Patterns
After a reaction or reaction pattern has checked (by previous commands) for format and existence in the database, it should be read and stored in the database.  The storage routine assumes the read and existence checks have been performed.  


