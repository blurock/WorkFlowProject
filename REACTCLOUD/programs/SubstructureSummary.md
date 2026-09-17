** Goal
The goal of this task is to summarize the set of all substructures. The sub task is to determine whether there are any duplicates.

Examine all the substructure files listed in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/programs/setup/readsubsset.sh and /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/programs/setup/extrasubs.sh

The substructures are found in the directory /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/data/mol/subs

*** First task.

Examine each sdf structure and group sets of substructures in the same class. A substructure class is defined by all substructures that have the same structure but only differ with given atoms have an h (hydrogen) or r (a general alkyl group). This difference can be seen with the name. For example, in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/data/mol/subs/subsLongerRadicalChains5Carbons.sdf the substructures defined have a similar structure but with every combination of substition of r, q and h at given atom positions. This can be seen from the name. Starting with the first substructure, rest of the substructure have every combination of r, q and h at the numbered atom positions where there is a difference.
We will label the general class as .c(XX)cccc(XXX) where XX and XXX are the set of h's and r's in the order of the atom positions.
Make a cvs table in this directory labeled Summary where:

Column 1: The filename where the substructure class exists.
Column 2: The Class name
Column 3: The substructures in this class (one substructure per line.)

Order the lines in the summary table based on the general class name. 

**** Notes and Checks.
1. Only do the analysis with the name. You do not have analyse the actual structures. 
2. A single file can define several classes. 
3. All classes should have every combination of r, q and h at the numbered atom positions where there is a difference. For example (X) should have 2, ((XX) should have 4, etc. 
4. A q is considered both an h and an r.
5. Mark class in red if when there is suspected duplicate.
6. Ask questions if unclear.




