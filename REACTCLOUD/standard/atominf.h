/********************************************************************/
/*** Atomic Information Objects */

/********************************************************************/
/*** StaticAtomInfo
     This is information that is read in from the file 
     with information particular for each atom.

          AtomicNumber      - The atomic number of the atom
          Name              - The symbolic name of the atom
          CovalentRadius    - The covalent radius of the atom
                              (used in partial charge calculations)
*/

typedef struct StaAtmInf {
     INT    AtomicNumber;
     CHAR   Name[2];
     FLOAT  CovalentRadius;
     } StaticAtomInfo;

#define StaticAtomInfoSize sizeof(StaticAtomInfo)

/**********************************************************************/
/****** StaticAtomInfoSet

     This is the structure holding all the static information.

      NAtoms       - This is the number of atoms having information
      Atoms        - This is a vector of StaticAtomInfo structures
*/

typedef struct StatAtomInfoSet {
     INT             NAtoms;
     StaticAtomInfo  *Atoms;
     } StaticAtomInfoSet;

#define StaticAtomInfoSetSize sizeof(StaticAtomInfoSet)

extern int InitializeStaticAtomInfo(char *StaticAtomInfoFile);
extern void PrtStatAtomInfoSet(INT start,INT finish);
extern INT AtomicNumberFromSymbol(CHAR *symbol);
extern CHAR *AtomNameFromAtomicNumber(INT num);

