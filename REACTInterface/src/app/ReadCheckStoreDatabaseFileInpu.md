*** Goal
This is a description of the interface for reading in source files to the REACTCLOUD database. The sequence will be the same for the input of molecules, substructures reaction patterns and reactions. The input sequence will always be:
1. Read the the formatted text File to see whether there are any format errors in reading in. The read in data structures are displayed so the user can manually examine if the information is correct. 
2. The second step is check whether the data structures are already present in the database. If they are present, the user can choose to skip them or replace them. If they are not present, the user can choose to add them to the database. the check deals will ALL the data in the file, if one or more are present, the user should modify the entire input structure (and go to step one).
3. The third step is to store the data structures in the database. In input files are stored in Cloud Storage and the data structures are stored in the REACTCLOUD database. 

*** Data structures
1. Molecule
2. Substructure
3. Reaction Pattern (both in ASCII and molfile format) 
4. Reaction (both in ASCII and molfile format)


*** Check of templates. 
For all of the data structures and all of the steps there is a corresponding inp  file (in directory REACTCLOUD/programs/inputs) 
These should be the model for the templates in REACTInterface/src/app/templates/command-templates.registry.ts.
if the template already exists, make sure the set of commands corresponds to that of the inp file.
if the template does not exist, create it.

In the implementation plan provide a table of command inp (from the  REACTCLOUD/programs/inputs/) files and the corresponding command templates (in REACTInterface/src/app/templates/). For all the data structures and for all three steps (read, check and store). This should be approved before the actual implementation proceeds.


*** the interface reflects the three steps

The look and feel of the read file interface should be a clean modern look (maybe provide some suggestions to choose from).
The part of the interface should be that before the next step can be performed, the previous steps have to be successful. Non-success from the Read or Check steps means that the sequence has to start from the beginning with a new formatted input file.

The interface should reflect these steps (possibly MatTabs?) There is also information that is common to all three steps, for example the data structures file and the derived root name. 

*** Read Step

The read step reads in the file (using the root name). 
There should be two outputs associated with the read step. 
1. The data structure that was read in. This output should be interpreted and displayed with the proper interface.
2. The raw output of the job. This should be displayed in a scrollable text area. If possible all lines with an ERROR could be in a different color(?)

*** Database Check Step
In this step the file is read in and the data structure is checked to see if it is already present in the database. 
There should be two outputs associated with the check step. 
1. The check shows a table of information about the data structures in the database and whether they are present.
2. The raw output of the job. This should be displayed in a scrollable text area. If possible all lines with an ERROR could be in a different color(?)

*** Database Store Step
In this step the file is read in and the data structure is stored in the database. 

1. The address of all the data structures that were should be listed in a table. 
2. The raw output of the job. This should be displayed in a scrollable text area. If possible all lines with an ERROR could be in a different color(?)

*** Generic Interface notes

There are several commonalities between the steps and the data structures. Try to consolidate the common elements into an algorithm. This also gives a similar look and feel over data structures and types. Common features that should be extracted are:
1. Each step and corresponding command has it own template (with a specific name). This implies a data driven algorithm.
2. the call using the template is in common
3. Each call produces a 'rawoutput' that should be displayed in a scrollable text area. Error possibly could be highlighted.
4. Each call displays a datastructure. There could be a table of data type and corresponding component. The input to the component would be the returned data structure.
5. 

The commonalities should be translated to a skill, so that when a new data structure is added, the same technique is used. 

*** Implementation Verification Plan

Once implementation is complete, the interface will be tested by the user. The user will determine when the interface meets the above specification and provide feed back. I have already tested the code using the provided test files in the REACTCLOUD/programs/inputs directory --- These files should not be modified unless the user verifies the change.




