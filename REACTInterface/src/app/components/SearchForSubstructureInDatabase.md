** Goal
The user draws in a ketcher window a substructure/molecule. The task is to see whether the molecule exists in the database or not.

** Basic Execution

1. Draw molecule/substructure in ketcher panel
2. Press button 'Find'
3. The molecule is converted to an SDF file.
4. This SDF file is written to the backend and the procedure as 'Database Check' in the Read, Check and Store' is performed on this file. The only difference is that the file being checked is the one generated from the ketcher window instead of being retrieved from the file system.
5. If struture found (exact match) report this fact giving the name and ID in the database.
If this is possible---- not sure
6. If the structure is not found, the user can press a button and the 'Molecule Creator & Editor' window is called with the ketcher molecule filled in. The user can then continue to edit the molecule as needed. 

** Reuse

The core of this task is to make a file and perform the 'Database Check' in the Read, Check and Store' procedure. So the best way to do this is to reuse this code. 
