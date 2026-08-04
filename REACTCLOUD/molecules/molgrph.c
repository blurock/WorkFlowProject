#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"


/*************************************************************************/
/*  These routines are the interface between the chemistry structures and
    the graph structures
*/
/*************************************************************************/

static void TranslateMolfileMetaAtom(GraphMetaAtom *graphmeta,
				     MolFileMetaAtom *molmeta);

extern INT DetermineValenceValue(INT atomid,
				 INT valence,
				 MoleculeInfo *molecule)
     {
     MolFileMolecule *molfile;
     MolFileAtom *molfileatom;
     INT value;
     PropValue *prop;
     
     value = 1;
     
     switch(valence)
	  {
     case VALENCE_ATOMIC_NUMBER:
	  molfile = molecule->Molfile;
	  molfileatom = molfile->Atoms + atomid;
	  value = molfileatom->AtomicNumber;
	  break;
     case VALENCE_STANDARD:
	  prop = FindAtomProperty(molecule,atomid,VALENCE);
	  value = prop->Integer;
	  FreePropValue(prop);
	  Free(prop);
	  break;
     default:
	  value = 1;
	  }
     return(value);
     }

extern INT IsValenceAHeavyAtom(INT type, INT valence)
     {
     INT ans;
     
     ans = 1;
     
     switch(valence)
	  {
     case VALENCE_ATOMIC_NUMBER:
	  if(type == 1) ans = 0;
	  break;
     case VALENCE_STANDARD:
	  if( type/VAL_ATOMIC_NUMBER == 1) ans = 0;
	  break;
     default:
	  ans = 1;
	  }
     return(ans);
     }


extern Graph *GraphFromMolFile(MoleculeInfo *molinfo,
			       INT valence)			       
     {
     Graph *graph;
     
     graph = AllocateGraph;
     GraphFromMolFileForArrays(graph,
			       molinfo,
			       valence);
     return(graph);
     }

extern void GraphFromMolFileForArrays(Graph *graph,
				      MoleculeInfo *molinfo,
				      INT valence)

     {
     Neighbor *neighbor;
     INT *types,i;
     MolFileAtom *atoms;
     MolFileMolecule *molecule;

     molecule = molinfo->Molfile;
     CreateGraph(graph,molecule->ID,molecule->Name,
		 molecule->NAtoms,
		 0,0,0);
     
     types = graph->NodeTypes;
     atoms = molecule->Atoms;
     LOOPi(graph->NumberOfNodes)
	  {
	  *types = DetermineValenceValue(i,valence,molinfo);
	  types++;
	  atoms++;
	  }
     
     neighbor = graph->Neighbors;
     LOOPi(graph->NumberOfNodes)
	  NeighborsFromMoleFile(i,neighbor++,molecule);
	  
     }

extern void NeighborsFromMoleFile(INT id, Neighbor *neighbor, 
				  MolFileMolecule *molecule)
     {
     INT *bnds,*bndstart,count,i;
     MolFileBond *bond;
     
     bnds = bndstart = AllocArrayINT(molecule->NAtoms);
     
     count = 0;
     bond = molecule->Bonds;
     LOOPi(molecule->NBonds)
	  {
	  if(id == bond->I )
	       {
	       count++;
	       *bnds++ = bond->J;
	       }
	  else if( id == bond->J )
	       {
	       count++;
	       *bnds++ = bond->I;
	       }
	  bond++;
	  }
     CreateNeighbor(neighbor,id,molecule->Name,
		    count,bndstart);

     Free(bndstart);
     }

extern SetOfGraphMetaAtoms 
     *TranslateSetOfMolfileMetaAtoms(SetOfMolFileMetaAtoms *setmolmeta)
     {
     SetOfGraphMetaAtoms *setgraphmeta;
     GraphMetaAtom *graphmeta;
     MolFileMetaAtom *molmeta;
     INT i;
     
     setgraphmeta = AllocateSetOfGraphMetaAtoms;
     CreateSetOfGraphMetaAtoms(setgraphmeta,setmolmeta->ID,
			       setmolmeta->Name,
			       setmolmeta->NumberOfMetaAtoms,
			       0);
     
     graphmeta = setgraphmeta->MetaAtoms;
     molmeta = setmolmeta->MetaAtoms;
     LOOPi(setmolmeta->NumberOfMetaAtoms)
	  {
	  TranslateMolfileMetaAtom(graphmeta,molmeta);
	  graphmeta++;
	  molmeta++;
	  }
     
     return(setgraphmeta);
     }

static void TranslateMolfileMetaAtom(GraphMetaAtom *graphmeta,
				     MolFileMetaAtom *molmeta)
     {
     INT charge,radical,resonance,nele,group,lonepairs,single,dbond,triple,i;
     INT *atmnum,*bnding,*type;
     INT hydrogens;
     
     CreateGraphMetaAtom(graphmeta,molmeta->ID,molmeta->Name,
			 molmeta->NumberOfAliased,0);
     
     charge = 0;
     resonance = 0;
     radical = 0;
     
     atmnum = molmeta->AtomicNumbers;
     bnding = molmeta->Bonding;
     type   = graphmeta->AtomicTypes;
     LOOPi(graphmeta->NumberOfAliased)
	  {
	  

	  nele = *atmnum - charge;
	  group = AtomGroupFromElectrons(nele);
	  lonepairs = CountLonePairsOfAtom(group,*bnding);
	  
	  single = 0;
	  dbond= 0;
	  triple = 0;
	  hydrogens = 0;
	  
	  if(*bnding == 1)
	       single = 1;
	  else if(*bnding == 2)
	       dbond = 1;
	  else 
	       triple = 1;
	  
	  single += SingleBondsNotSpecified(group,lonepairs,*bnding);
	       
	  *type = DetermineAtomValenceValue(*atmnum,
					    hydrogens,
					    charge,
					    radical,
					    lonepairs,
					    resonance,
					    single,
					    dbond,
					    triple);
	  atmnum++;
	  bnding++;
	  type++;
	  }
     }


extern GraphReaction *PutSetOfGraphsInGraphReaction(SetOfGraphs *molset,
						    INT flag)
     {
     GraphReaction *grxn;
     Graph *mol,*graph;
     INT i;
     
     grxn = AllocateGraphReaction;
     switch(flag)
	  {
     case REACTANT:
	  CreateGraphReaction(grxn,molset->ID,molset->Name,
			      molset->NumberOfGraphs,0,0,0);
	  graph = grxn->GraphLHS;
	  break;
     case PRODUCT:
	  CreateGraphReaction(grxn,molset->ID,molset->Name,
			      0,0,molset->NumberOfGraphs,0);
	  graph = grxn->GraphLHS;
	  break;
     default:
	  graph = 0;
	  break;
	  }
     
     mol = molset->Graphs;
     LOOPi(molset->NumberOfGraphs)
	  {
	  CopyFullGraph(graph,mol);
	  graph++;
	  mol++;
	  }
     return(grxn);
     }

