*** Description

This is a description of the first phase of making an interface for the cloud version of the molecules database (REACTCLOUD), Make an implmentation plan.
In this first phase, we are concerned with:
1. Create a angular material design interface to run REACTCLOUD on a Google Cloud Run container.
2. Having a secure interface, using a user login (this will happen automatically using the google cloud console)
3. The interface will be using Angular Material Design to have a consistent look and feel.
4. the JAVA interface will be used to call the REACTCLOUD API for the data, which is located in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/src/http-server.c
5. The molecular system is created and run as a container using the Dockerfile (/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/Dockerfile)
6. Modify /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/src/http-server.c to only allow logged in users to access the API. In later phases, the user ID will be used to set up a unique environment for that user.

** The material design interface
1. Create a Angular Material Design application. A modern clean interface should be made. Prefer to use the styles of material design avoiding specialized styles.
2. The pages should be responsive and functional in mobile and larger displays
3. The landing page should have a login in the banner and a method to login 
4. The main part of the landing page should have
    a. A short intro to the reactcloud system and what it can do
    b. A means to login
5. When the user logs in, the user is routed to a page that has different tasks. Each of these tasks have to do with calls to the REACTCLOUD API. The current API is located in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/src/http-server.c. This could be redesigned (see notes in the file).
    
*** Structure of calls to REACTCLOUD API

1. The calls by the iterface will, at first, simulate the scripts located in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/programs/scripts
2. The input will be a set of commands such as those in *.inp files found in the directory /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/programs/inputs. Some of these files are templates and are modified with user input. 
3. The output will be captured (it is written to stdout in the C program) and iterpreted by the interface. 

*** Tasks to be implemented in the first phase. 
1. There are several similare tasks in which the input does not need to be modified and the output is similar (these *.inp files will be placed in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/programs/inputs):
    a. PrintMoleculeList.inp
    b. PrintRxnPatternsList.inp
    c. PrintSubStructures.inp
    d. PrinBensonList.inp
2. The output is a list of molecules, reaction patterns, substructures, or Benson groups, depending on the task.
3. Each list item is  of the form, a id number, a ':', '-->', the name of the group, '<--':
For example:
     24018: -->KetoHydroPeroxideDecompToAldRadical-CRRRH<--
4. This should be displayed as a list of buttons in a material design list, where each button is a list item. The button should have the name of the group. Later, this button will retrieve the item with another API call. but in the current phase it will do nothing. The list can be long so it should be in a scrollable area. There should be a banner above the list with the name of the task.
5. The output by the API task has other information and the interface should parse this information and display just the list in the main area.
6. One way to isolate the list is to look for lines with ': -->'
7. The first line that contains these is the first line of the list. The last line that contains these is the last line of the list.
8. There are other lines that should be ignored.

*** Current API Task structure ***
1. _The current API is written in C and is located in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/src/http-server.c.
2. Its input is a JSON object.
3. The *.inp file name is given by the "inputFile" key.

** Alternatives for input **
1. In the implementatio plan, make a suggestion of a better way to do this. In the actual implementation, follow the plan.
2. Each line in the *.inp file is a command to the program. In principle, these commands could be streamed to the input. As can be seen from the scripts in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/programs/scripts, the *.inp files are piped to the program: for esample:
$CHEMPROG test < $INPPRINT >! $TEMPDIR/tmp.out
3. In later versions, the commannds could be given as interactive input (simulating what happens in the command line version of the program.)

