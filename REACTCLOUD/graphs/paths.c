#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"

void SetOfPathsFromNode(DataSubSetVector *total, INT node, Graph *graph, PairSet *bondset, 
			DataSubSet *path, DataSubSet *uptonow, int (*comp)());
DataSubSetVector *LargestPaths(DataSubSetVector *orig);

/*f sets = FindSetOfPaths(graph)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
DataSubSetVector *FindSetOfPaths(Graph *graph, int (*comp)()) {
  DataSubSet *set,*atomset,*path;
  DataSubSetVector *totalset,*uniqueset;
  INT i,length;
  char *str;
  PairSet *bondset;

  atomset = AllocateDataSubSet;
  SetUpAtomSetFromGraph(atomset,ALL_ATOMS,graph);

  bondset = SetOfBonds(graph,atomset,4*atomset->NumberOfPoints);
  totalset = AllocateDataSubSetVector;
  CreateDataSubSetVector(totalset,graph->ID,graph->Name,
			 graph->NumberOfNodes*graph->NumberOfNodes,0);
  totalset->NumberOfVectors = 0;

  for(i=0;i<graph->NumberOfNodes;i++) {
    if((*comp)(*(graph->NodeTypes + i))) {
      set = RemoveI(i,atomset);
      path = AllocateDataSubSet;
      CreateDataSubSet(path,0,0,graph->NumberOfNodes,1,0);
      *(path->Points) = i;
      SetOfPathsFromNode(totalset,i,graph,bondset,path,set,comp);
      FreeDataSubSet(set);
      Free(set);
      FreeDataSubSet(path);
      Free(path);
    }
  }
  uniqueset = LargestPaths(totalset);

  FreeDataSubSetVector(totalset);
  Free(totalset);

  return uniqueset;
}
/*f sets = TakeFirstOccurance()
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern DataSubSet *TakeFirstOccuranceAway(DataSubSet *set, int element) {
  DataSubSet *newset;
  int cnt,j;
  newset = AllocateDataSubSet;
  cnt = 0;
  CreateDataSubSet(newset,0,0,1000,set->NumberOfPoints-1,0);
  for(j=0;j<set->NumberOfPoints;j++) {
    if(element != *(set->Points + j)) {
      *(newset->Points + cnt) = *(set->Points + j);
      cnt++;
    }
  }
  return newset;
}
extern DataSubSet *AddElementToSet(DataSubSet *set, int element) {
  DataSubSet *newset;
  int i;

  newset = AllocateDataSubSet;
  CreateDataSubSet(newset,0,0,1000,set->NumberOfPoints+1,0);
  for(i=0;i<set->NumberOfPoints;i++) {
    *(newset->Points + i) = *(set->Points + i);
  }
  //memcpy(newpath->Points,path->Points,path->NumberOfPoints*sizeof(cnt));
  *(newset->Points + set->NumberOfPoints) = element;

  return newset;
}
extern int IsSmallerSubsetOf(DataSubSet *set, DataSubSet *subset) {
  int ans,notdone;
  int i,*pnt,j,*subpnt;
  if(subset->NumberOfPoints >= set->NumberOfPoints)
    ans = 0;
  else {
    subpnt = subset->Points;
    i=0;
    ans = 1;
    while(i<subset->NumberOfPoints && ans) {
      j = 0;
      pnt = set->Points;
      notdone = 1;
      while(j < set->NumberOfPoints && notdone) {
	if(*pnt == *subpnt)
	  notdone = 0;
	pnt++;
	j++;
      }
      
      if(notdone == 1)
	ans = 0;
      i++;
      subpnt++;
    }
  }
  return ans;
}
/*f sets = SetOfPathsFromNode(node,graph,bondset)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
void SetOfPathsFromNode(DataSubSetVector *total, INT node, Graph *graph, PairSet *bondset, 
			DataSubSet *path, DataSubSet *uptonow, int (*comp)()) {
  Neighbor *neighbors;
  DataSubSet *nset,*newset,*newpath;
  int *atom,i,j,length,cnt,foundone;
  char *str,*str1,*str2;
  neighbors = Neighbors(node,graph,uptonow);
  nset = NeighborToDataSubSet(neighbors);
  
  /*
  printf("Node: %d: (",*(graph->NodeTypes + node));
  for(i=0;i<nset->NumberOfPoints;i++)
    printf(" %4d ",*(nset->Points+i));
  printf(")\n");
  */
  foundone = 0;
  for(i=0;i<nset->NumberOfPoints;i++) {
    atom = nset->Points+i;
    if((*comp)(*(graph->NodeTypes + *atom))) {
      foundone = 1;
      newset = TakeFirstOccuranceAway(uptonow,*atom);
      newpath = AddElementToSet(path,*atom);
      SetOfPathsFromNode(total,*atom,graph,bondset,newpath,newset,comp);
      FreeDataSubSet(newset);
      Free(newset);
      FreeDataSubSet(newpath);
      Free(newpath);
    }
  }
  if(!foundone) {
    newset = total->Vector + total->NumberOfVectors;
    CopyFullDataSubSet(newset,path);
    total->NumberOfVectors++;
  }
}
/*f sets = LargestPaths(totalset)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
DataSubSetVector *LargestPaths(DataSubSetVector *orig) {
  DataSubSetVector *unique;
  DataSubSet *set,*set1,*set2,*uniqueset,*complement;
  INT i,j,notdone,length;
  CHAR *str;

  unique = AllocateDataSubSetVector;
  CreateDataSubSetVector(unique,0,0,orig->NumberOfVectors,0);
  unique->NumberOfVectors = 0;
  uniqueset = unique->Vector;
  for(i=0;i<orig->NumberOfVectors;i++) {
    notdone = 1;
    set1 = orig->Vector + i;
    for(j=0;j<orig->NumberOfVectors && notdone;j++) {
      set2 = orig->Vector + j;
      if(IsSmallerSubsetOf(set2,set1))
	 notdone = 0;
    }
    if(notdone == 1) {
      CopyFullDataSubSet(uniqueset,set1);
      unique->NumberOfVectors++;
      uniqueset++;
    }
  }
  return unique;
}
