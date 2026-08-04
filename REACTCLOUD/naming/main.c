/*  FILE     paths.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    
**
**  REFERENCES
**
**  COPYRIGHT (C) 1995  REACTION Project / Edward S. Blurock 
*/
/*I  . . . INCLUDES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
 
#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"
#include "molprops.h"
#include "naming.h"

StaticAtomInfoSet *STATICATOMINFO;

/*F ret = main(argc,argv)
**
**  DESCRIPTION
**    argc: Should be three arguments:
                 programname runname menutype
**    argv: The arguments
**    
**    ret: The exit value
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
int main(int argc, char *argv[])
{
  int ans,done,i;
  char *homedir,*statinf;
  Graph *graph;
  SetOfGraphs *set;
  FILE *metafile,*moleculefile;
  MolFileMolecule *molmolf;
  SetOfMolFileMetaAtoms *metaatoms;
  CHAR *metafileS,*moleculeS;
  MoleculeElectronic *molelectronic;
  MoleculeInfo *molinfo;
  CHAR *name,*shortname;
  INT shortcount,longcount;

  REFERENCE_SET_OF_MOLECULES = NULL;
  if(argc < 2)
    {
      printf("Call:\n");
      printf("       molecule file:   The name of the molecule to name");
      printf("       [metafile]: optional, for example /home/reaction/react/data/StandardMeta.mta");
      exit(1);
    }
  homedir = getenv("REACTROOT");
  printf("ARGC: %d\n",argc);
  if(argc > 2)
    {
      metafileS = CopyString(argv[2]);
    }
  else
    {
      metafileS = AllocateString(LINELENGTH);
      sprintf(metafileS,"%s/data/StandardMeta.mta",homedir);
      printf("-->Read MetaAtom Information: %s\n",metafileS);
    }

  moleculeS = CopyString(argv[1]);
  statinf = AllocateString(LINELENGTH);
  sprintf(statinf,"%s/data/stat-inf.dat",homedir);
  printf("Read Static Information: %s\n",statinf);
  InitializeStaticAtomInfo(statinf);
  printf("Read MetaAtom Information: %s\n",metafileS);
  metafile = fopen(metafileS,"r");
  metaatoms = MetaAtomInfoRead(metafileS,metafile);

  moleculefile = fopen(moleculeS,"r");

  molmolf = AllocateMolFileMolecule;
  set = GenerateCarbonPaths();
  done = ReadSDFMol(moleculefile,molmolf,metaatoms);
  while(done == SYSTEM_NORMAL_RETURN) {
    molinfo = AllocateMoleculeInfo;
    CreateMoleculeInfo(molinfo, molmolf->ID, molmolf->Name,
		       molmolf,0,0);
    molinfo->Electronic = ElectronicFromMolFile(molmolf);
    name = AllocateString(LINELENGTH);
    longcount = LINELENGTH;
    GenerateLongName(name,&longcount,molinfo);
    shortname = AllocateString(LINELENGTH);
    shortcount = LINELENGTH;
    NameOfMolecule(shortname,&shortcount,molinfo);
    printf("GeneratedName: %s: %s  (%s)\n",molinfo->Name,name, shortname);
    Free(shortname);
    done = ReadSDFMol(moleculefile,molmolf,metaatoms);
  }

  return(0);
}
