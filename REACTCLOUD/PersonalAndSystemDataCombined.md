** Goal
The goal is to have a set of system database objects that a user can read, but not modify, combined with the users personal database objects that the user can create, modify, delete and read. 

*** User View

The first question to is how the user sees the entire list. One suggestion is to have a toggle that allows the user to switch between the system view and the personal view. If the user is in the system view, they see the system objects. If the user is in the personal view, they see the personal objects. 

** Database Layer

The database layer is responsible for storing and retrieving the system and personal database objects. 
1. the user cannot modify the system objects, the user can only read the system objects.
2. the user can modify the personal objects. 

One important question is if the user wants to modify a system object or creates an object in the personal database that has the same name as a system object, how is this handled?

When the object is used, how does the database know whether to use the system object or the personal object? One approach is that first the personal database is searched and if not found, then the system database. Any other suggestions would be welcome. 

*** Modularization

Try to centralize the decision process of how data objects are retrieved and which 'user' (or 'system') databases are accessed. 

If this can be centralized in some way independent of the object type, would be ideal --- if possible.  Give all suggestions, ask questions if necessary. 

It is not desirable to have many if-the-else statements spread throughout the code for determining from where the data object is to be retrieved.  Any modularization of this decision process would be welcome.

*** Object definition 

Apply this to the current set of objects: molecules, reactions, and reaction patterns, mechanism paths, mechanisms, etc.  that are now defined in the system. 

Part of the implementation plan is to go through all objects that have been implemented so far and determine where they are being used in the code.  This is a significant amount of work.  Any suggestions would be welcome.

At the end of the implementation define a skill that can provide how a new object type would be introduced to the database structure.  That skill should be able to be used in the development of future objects. 
