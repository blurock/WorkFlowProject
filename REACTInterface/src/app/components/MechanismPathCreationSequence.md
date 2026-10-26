*** goal
The goal of this interface is to create, modify and test a mechanism pathway. It will be a step by step procedure with checks along the way. 

The goal of the interface is to be able to run visualize the mechanism path, modifying the path, reaction patterns, individual steps, and the results of running (consective) individual steps and visualizing the results without getting confused by excess information on the screen. Parts that are not being examined at the time should be minimized or not visible. One of the design decisions is how to present this information. Are tabs a useful alternative, since things are done sucessively? Other aspects is reducing panels to single lines if they are not being used. Several alternative Recomendations should be made to find the optimal solution. 

The goal is to be able to create and then immediately test the step. Basically, this is going step by step through the mechanism generation procedure. The goal is to be able to see the application of the reaction patterns at each step. 

When the panel is initialially opened there will be fields for the following information:
1. The name of the mechanism path
2. The target molecule to test the mechanism path (with selection posibility from molecule list)
3. The set of auxiliary molecules (with selection posibility from molecule list)
4. Two buttons: 
      a: Read in existing mechanism path
      b: Create a new mechanism path
5. a: In read in a mechanism path, the path is read in and the steps are created in the interface. 
   b: A new empty mechanism step is set up and shown. 
6. At this point a button is alway shown 'Add Step'

After this point the emphasis is on creating, modifying and testing individual steps. Information outside the focus of what one is doing should be minimized. If adding reaction patterns is the focus, then displaying test results should be minimized. And when testing is underway

If desired, an existing mechanism path can be loaded and visualize. Upon loading the mechanism path, each step would be reduced to a single line item with the name of the step (or just Step 1, Step 2, etc.) with an eye icon to display the details of the step. 

Initialization:: Set up the 'Current Molecules' to be the target molecule and a set of auxillary molecules.

Mechanism Step Creation:
1. Choose the set of reaction patterns to make up the step. There are two methods to do this:
    a. Choose the reaction patterns from a list (with them divided into classes).
    b. Choose the reaction pattern using a ketcher window find reaction patterns which match a drawn pattern.
2. Choose the auxillary molecules which are needed for this step are set up.
3. Apply the 'Current' Molecules' to the reaction patterns in the step.
4. Display the resulting reactions that were created.
5. Display the resulting molecules that were created
4. The molecules created will be the next set of current molecules.
5. If the results are accepted for this step, then move on tocreate the next step (go to step 1 again).
6. If the results are rejected for this step, the reaction patterns and auxillary molecules can be adjusted to try again.

*** Mechanism Step Panel.

The mechanism step panel has several panels:
1. The set of current molecules
2. The panel for adding reaction patterns to the mechanism step.
3. The panel for adding auxillary molecules to the mechanism step.
4. The panel for displaying the resulting reactions that were created.
5. The panel for displaying the resulting molecules that were created.

The mechanism step panel can be reduced to a single line:
1. The name of the mechanism step.
2. An eye icon to be able to display the whole panel.
3. A trash can icon to be able to delete the mechanism step and work on previous steps.


 