#include "compile.h"
#include "basic.h"

#include "chemistry.h"

static INT SearchForCoordinateBegin(FILE *file);
static INT ReadCoordinates(FILE *file, ZCoordinates *zc);
static INT GotoBondStretchBegin(FILE *file);
static INT ReadBondStretch(FILE *file, ZCoordinates *zc);
static INT GotoAngleBendBegin(FILE *file);
static INT ReadAngleBend(FILE *file, ZCoordinates *zc);
static INT GotoTorsionalBegin(FILE *file);
static INT ReadTorsional(FILE *file, ZCoordinates *zc);


static ZMatrix *CreateZMatrixFromCoords(ZCoordinates *zc);
static INT ChooseGroupOfFour(ZMatrix *zm,
			     INT *index, 
			     ZCoordinates *zc,
			     INT *atomused,
			     INT *bondused,
			     INT *angleused,
			     INT *torsionused);
static void MarkUsed(INT index, INT *atomused);
static FFAtomInfo *ChooseAtomFromAtom(ZMatrix *zm, 
				      ZCoordinates *zc,
				      INT *atomused);
static BondStretch *ChooseAtomFromBond(INT *index, ZCoordinates *zc,
				       INT *atomused,
				       INT *bondused);
static BondAngle *ChooseAtomFromAngle(INT *index, ZCoordinates *zc,
				      INT *atomused,
				      INT *angleused);
static Torsional *ChooseAtomFromTorsional(INT *index, ZCoordinates *zc,
					  INT *atomused,
					  INT *angleused);
static INT MemberUsed(INT element, INT *vector, INT num);
static BondStretch *SelectBondStretch(ZCoordinates *zc, 
				      INT *indexvec,
				      INT *newindex,
				      INT *used);
static BondAngle *SelectBondAngle(ZCoordinates *zc,
				  INT *indexvec,
				  INT *newindex,
				  INT *used);
static Torsional *SelectTorsional(ZCoordinates *zc,
				  INT *indexvec,
				  INT *newindex,
				  INT *used);
static void InitializeUsedVector(INT *vec, INT num);
static void ShiftIndices(INT *index);
static void PrintZMatrixToFile(FILE *file, ZMatrix *zm);

#define USED      1
#define UNUSED    0


extern ZCoordinates *ReadInFFInformation(FILE *file, 
					 INT id,
					 CHAR *name,
					 INT MaxAtoms,
					 INT MaxBonds,
					 INT MaxAngles,
					 INT MaxTorsional);
extern void PrintPrettyZCoordinates(ZCoordinates *zc);


#define FINAL_VALUE_STRING "          **** FINAL VALUES ****"
#define NOT_FINAL_STRING "          **** LATEST VALUES ****               NOT FINAL"
#define FF_TITLE_CHECK " ATOM     X           Y           Z     "
#define FF_TITLE_CHECK_NUM      40

#define END_ATOM_COORDS  "0------DIRECTION COSINES------"
#define END_ATOM_COORDS_NUM 30

#define BOND_STRETCHING_STRING "        B O N D   S T R E T C H I N G        "
#define END_BOND_STRETCH  "     RMS BOND LENGTH DEVIATION"
#define END_BOND_STRETCH_NUM 30

#define ANGLE_BEND_START "           A N G L E   B E N D I N G              "
#define ANGLE_BEND_END "     RMS VALENCE ANGLE DEVIATION"
#define ANGLE_BEND_END_NUM 32

#define TORSIONAL_START "            T O R S I O N A L                "
#define TORSIONAL_END   "     RMS TORSION ANGLE CHANGE"
#define TORSIONAL_END_NUM 29

#define FF_NOT_COMPLETE    0
#define FF_OPTIMIZED       1
#define FF_NOT_OPTIMIZED   2
#define FF_SUCCESSFUL      1
#define SEARCH             -1

/**************************************************************************/
/* Read in data from Output
*/
extern INT ReadFFOutputData(MASTER_STRUCTURE)
     {
     ZCoordinates *zc;
     FILE *file;
     ZMatrix *zm;
     
     file = OpenReadFile("./ff/output/alkanes17.out","",-1);
     zc = ReadInFFInformation(file,1,0,
			      100,100,100,100);
     zm = CreateZMatrixFromCoords(zc);
     PrintZMatrixToFile(stdout,zm);
     
     }
     
/*
	  out = StringBondStretch(bond,string);
	  out = StringBondAngle(angle,string);
	  out = StringTorsional(torsion,string);
*/
static CHAR *StringBondStretch(BondStretch *bond, CHAR *string)
     {
     sprintf(string,"%5d %5d %10.3f",
	     bond->I,
	     bond->J,
	     bond->BondLength);
     return(string);
     }
static CHAR *StringBondAngle(BondAngle *angle, CHAR *string)
     {
     sprintf(string,"%5d %5d %5d %10.3f",
	     angle->I,
	     angle->J,
	     angle->K,
	     angle->Angle);
     }
static CHAR *StringTorsional(Torsional *torsion, CHAR *string)
     {
     sprintf(string,"%5d %5d %5d %5d %10.3f",
	     torsion->I,
	     torsion->J,
	     torsion->K,
	     torsion->L,
	     torsion->TorsionAngle);
     }


extern void PrintPrettyZCoordinates(ZCoordinates *zc)
     {
     CHAR *string,*out,*out1;
     BondStretch *bond;
     BondAngle   *angle;
     Torsional   *torsion;
     INT i;
     
     string = AllocateString(LINELENGTH);
     out1   = AllocateString(LINELENGTH);
     
     bond = zc->BondStretchSet;
     LOOPi(zc->NumberOfBondStretches)
	  {
	  out = StringBondStretch(bond,string);
	  sprintf(out1,"%5d: %s\n",i,out);
	  printf("%s",out1);
	  bond++;
	  }

     angle = zc->BondAngleSet;
     LOOPi(zc->NumberOfBondAngles)
	  {
	  out = StringBondAngle(angle,string);
	  sprintf(out1,"%5d: %s\n",i,out);
	  printf("%s",out1);
	  angle++;
	  }
     torsion = zc->TorsionalSet;
     LOOPi(zc->NumberOfTorsional)
	  {
	  out = StringTorsional(torsion,string);
	  sprintf(out1,"%5d: %s\n",i,out);
	  printf("%s",out1);
	  torsion++;
	  }
     }

extern ZCoordinates *ReadInFFInformation(FILE *file, 
					 INT id,
					 CHAR *name,
					 INT MaxAtoms,
					 INT MaxBonds,
					 INT MaxAngles,
					 INT MaxTorsional)
     {
     ZCoordinates *zc,*zcoord;
     INT success;
     
     zc = AllocateZCoordinates;
     CreateZCoordinates(zc,id,name,
			MaxAtoms,
			MaxBonds,
			MaxAngles,
			MaxTorsional,
			0,0,0,0);
     success = SearchForCoordinateBegin(file);
     if(success != FF_NOT_COMPLETE) 
	  success = ReadCoordinates(file,zc);
     if(success != FF_NOT_COMPLETE) 
	  success = GotoBondStretchBegin(file);
     if(success != FF_NOT_COMPLETE) 
	  success = ReadBondStretch(file,zc);
     if(success != FF_NOT_COMPLETE) 
	  success = GotoAngleBendBegin(file);
     if(success != FF_NOT_COMPLETE) 
	  ReadAngleBend(file,zc);
     if(success != FF_NOT_COMPLETE) 
	  GotoTorsionalBegin(file);
     if(success != FF_NOT_COMPLETE) 
	  ReadTorsional(file,zc);
     zcoord = AllocateZCoordinates;
     CopyFullZCoordinates(zcoord,zc);
     FreeZCoordinates(zc);
     Free(zc);
     return(zcoord);
     }

     

static INT SearchForCoordinateBegin(FILE *file)
     {
     CHAR *string,*line;
     INT done,i;
     
     string = AllocateString(LINELENGTH);
     
     line = NextNonBlankLine(file,string);
     done = FF_NOT_COMPLETE;
     while(done == 0 && line != 0)
	  {
	  if(!strcmp(line, FINAL_VALUE_STRING))
	       done = FF_OPTIMIZED;
	  else if(!strcmp(line, NOT_FINAL_STRING))
	       done = FF_NOT_OPTIMIZED;
	  line = NextNonBlankLine(file,string);
	  }
     if(done != FF_NOT_COMPLETE)
	  {
	  line = NextNonBlankLine(file,string);
	  if(strncmp(FF_TITLE_CHECK,line,FF_TITLE_CHECK_NUM))
	       done = FF_NOT_COMPLETE;
	  }
     Free(string);
	  
     return(done);
     }

static INT ReadCoordinates(FILE *file, ZCoordinates *zc)
     {
     INT done,i,count;
     CHAR *line,*string;
     FFAtomInfo *atom;
     
     string = AllocateString(LINELENGTH);
     atom = zc->AtomInfo;
     done = SEARCH;
     count = 0;
     while(done == SEARCH)
	  {
	  line = NextNonBlankLine(file,string);
	  
	  if(line != 0)
	       {
	       if(!strncmp(END_ATOM_COORDS,line,END_ATOM_COORDS_NUM))
		    done = FF_SUCCESSFUL;
	       else
		    {
		    atom->ID = count + 1;
		    atom->Name = 0;
		    sscanf(line," %d  %f  %f  %f",
			   &(atom->ID),&(atom->X),&(atom->Y),&(atom->Z));
		    atom++;
		    count++;
		    }
	       }
	  else
	       done = FF_NOT_COMPLETE;
	  }
     zc->NumberOfAtoms = count;
     return(done);
     }

static INT GotoBondStretchBegin(FILE *file)
     {
     CHAR *string,*line;
     INT done,i;
     
     string = AllocateString(LINELENGTH);
     
     done = SEARCH;
     while(done == SEARCH)
	  {
	  line = NextNonBlankLine(file,string);
	  if(line != 0)
	       {
	       if(!strcmp(line, BOND_STRETCHING_STRING))
		    done = FF_SUCCESSFUL;
	       }
	  else
	       done = FF_NOT_COMPLETE;
	  }
     
     if(done == FF_SUCCESSFUL)
	  {
	  line = NextNonBlankLine(file,string);
	  line = NextNonBlankLine(file,string);
	  }
     Free(string);
	  
     return(done);
     }

static INT ReadBondStretch(FILE *file, ZCoordinates *zc)
     {
     INT done,i,count;
     CHAR *line,*string;
     BondStretch *bond;
     
     string = AllocateString(LINELENGTH);
     bond = zc->BondStretchSet;
     done = SEARCH;
     count = 0;
     while(done == SEARCH)
	  {
	  line = NextNonBlankLine(file,string);
	  if(line != 0)
	       {
	       if(!strncmp(END_BOND_STRETCH,line,END_BOND_STRETCH_NUM))
		    done = FF_SUCCESSFUL;
	       else
		    {
		    bond->ID = count + 1;
		    bond->Name = 0;
		    sscanf(line," %3d  %3d  %f",
			   &(bond->I),
			   &(bond->J),
			   &(bond->BondLength));
		    bond++;
		    count++;
		    }
	       }
	  else
	       done = FF_NOT_COMPLETE;
	  }
     if(done == FF_SUCCESSFUL)
	  zc->NumberOfBondStretches = count;
     else 
	  zc->NumberOfBondStretches = 0;
     return(done);
     }

static INT GotoAngleBendBegin(FILE *file)
     {
     CHAR *string,*line;
     INT done,i;
     
     string = AllocateString(LINELENGTH);
     
     done = SEARCH;
     while(done == SEARCH)
	  {
	  line = NextNonBlankLine(file,string);
	  if(line != 0)
	       {
	       if(!strcmp(line,ANGLE_BEND_START))
		    done = FF_SUCCESSFUL;
	       }
	  else
	       done = FF_NOT_COMPLETE;
	  }
     
     if(done == FF_SUCCESSFUL)
	  {
	  line = NextNonBlankLine(file,string);
	  line = NextNonBlankLine(file,string);
	  }
     Free(string);
	  
     return(done);
     }

static INT ReadAngleBend(FILE *file, ZCoordinates *zc)
     {
     INT done,i,count;
     CHAR *line,*string;
     BondAngle *angle;
     
     string = AllocateString(LINELENGTH);
     angle = zc->BondAngleSet;
     done = SEARCH;
     count = 0;
     while(done == SEARCH)
	  {
	  line = NextNonBlankLine(file,string);
	  if(line != 0)
	       {
	       if(!strncmp(ANGLE_BEND_END,line,ANGLE_BEND_END_NUM))
		    done = FF_SUCCESSFUL;
	       else
		    {
		    angle->ID = count + 1;
		    angle->Name = 0;
		    sscanf(line," %3d  %3d  %3d  %f",
			   &(angle->I),
			   &(angle->J),
			   &(angle->K),
			   &(angle->Angle));
		    angle++;
		    count++;
		    }
	       }
	  else
	       done = FF_NOT_COMPLETE;
	  }
     if(done == FF_SUCCESSFUL)
	  zc->NumberOfBondAngles = count;
     else 
	  zc->NumberOfBondAngles = 0;
	  
     
     return(done);
     }

static INT GotoTorsionalBegin(FILE *file)
     {
     CHAR *string,*line;
     INT done,i;
     
     string = AllocateString(LINELENGTH);
     
     done = SEARCH;
     while(done == SEARCH)
	  {
	  line = NextNonBlankLine(file,string);
	  if(line != 0)
	       {
	       if(!strcmp(line,TORSIONAL_START))
		    done = FF_SUCCESSFUL;
	       }
	  else
	       done = FF_NOT_COMPLETE;
	  }
     
     if(done == FF_SUCCESSFUL)
	  {
	  line = NextNonBlankLine(file,string);
	  line = NextNonBlankLine(file,string);
	  }
     Free(string);
	  
     return(done);
     }

static INT ReadTorsional(FILE *file, ZCoordinates *zc)
     {
     INT done,i,count;
     CHAR *line,*string;
     Torsional *torsion;
     
     string = AllocateString(LINELENGTH);
     torsion = zc->TorsionalSet;
     done = SEARCH;
     count = 0;
     while(done == SEARCH)
	  {
	  line = NextNonBlankLine(file,string);
	  if(line != 0)
	       {
	       if(!strncmp(TORSIONAL_END,line,TORSIONAL_END_NUM))
		    done = FF_SUCCESSFUL;
	       else
		    {
		    torsion->ID = count + 1;
		    torsion->Name = 0;
		    sscanf(line," %3d  %3d  %3d  %3d  %f",
			   &(torsion->I),
			   &(torsion->J),
			   &(torsion->K),
			   &(torsion->L),
			   &(torsion->TorsionAngle));
		    torsion++;
		    count++;
		    }
	       }
	  else
	       done = FF_NOT_COMPLETE;
	  }
     if(done == FF_SUCCESSFUL)
	  zc->NumberOfTorsional = count;
     else 
	  zc->NumberOfTorsional = 0;
	  
     return(done);
     }


/***************************************************************************/
/***************************************************************************/
/***************************************************************************/
/***************************************************************************/
static void PrintZMatrixToFile(FILE *file, ZMatrix *zm)
     {
     INT i;
     ZMatLine *zl;
     
     zl = zm->Set;
     LOOPi(zm->NumberOfAtoms)
	  {
	  fprintf(file,"%3d ",
		  zl->AtomicNumber);
	  if(i>0)
	       {
	       fprintf(file,"%3d %10f ",
		       zl->J, zl->BondLength);
	       if(i>1)
		    {
		    fprintf(file,"%3d %10f ",
			    zl->K, zl->Angle);
		    if(i>2)
			 {
			 fprintf(file,"%3d %10f ",
				 zl->L,zl->Torsion);
			 }
		    }
	       }
	  fprintf(file,"\n");
	  zl++;
	  }
     }

static ZMatrix *CreateZMatrixFromCoords(ZCoordinates *zc)
     {
     ZMatrix *zm;
     ZMatLine *zl,*zlstart,*zl0;
     INT *index,*indexstart,*atomused,*bondused,*angleused,*torsionused;
     INT currentindex,i,j;
     
     zm = AllocateZMatrix;
     CreateZMatrix(zm,zc->ID,zc->Name,
		   zc->NumberOfAtoms,
		   0);
     
     index = indexstart = AllocArrayINT(4);
     currentindex = 0;
     
     
     atomused = AllocArrayINT(zc->NumberOfAtoms);
     bondused = AllocArrayINT(zc->NumberOfBondStretches);
     angleused = AllocArrayINT(zc->NumberOfBondAngles);
     torsionused  = AllocArrayINT(zc->NumberOfTorsional);
     zl = zlstart = zm->Set;
     
     LOOPi(zc->NumberOfAtoms)
	  {
	  InitializeUsedVector(atomused,zc->NumberOfAtoms);
	  InitializeUsedVector(bondused,zc->NumberOfBondStretches);
	  InitializeUsedVector(angleused,zc->NumberOfBondAngles);
	  InitializeUsedVector(torsionused,zc->NumberOfTorsional);
	  index = indexstart;
	  LOOPj(4)
	       *index++ = 0;
	  index = indexstart;

	  zm->NumberOfAtoms = i;
	  zl0 = zlstart;
	  LOOPj(i)
	       {
	       *(atomused + zl0->ID - 1) = USED;
	       zl0++;
	       }

	  ChooseGroupOfFour(zm,index,zc,atomused,bondused,angleused,torsionused);
	  printf("%5d:  (%5d,%5d,%5d,%5d) \n",i,
		 *index,*(index+1),*(index+2),*(index+3));
	  zl++;
	  }
     return(zm);
     }

static void ShiftIndices(INT *index)
     {
     *(index + 0) = *(index + 1);
     *(index + 1) = *(index + 2);
     *(index + 2) = *(index + 3);
     *(index + 3) = 0;
     }

static void InitializeUsedVector(INT *vec, INT num)
     {
     INT i;
     
     LOOPi(num)
	  *(vec++) = UNUSED;
     }

	  
static INT ChooseGroupOfFour(ZMatrix *zm,
			     INT *index, 
			     ZCoordinates *zc,
			     INT *atomused,
			     INT *bondused,
			     INT *angleused,
			     INT *torsionused)
     {
     INT done;
     BondStretch *bond;
     FFAtomInfo *atominfo;
     BondAngle *angle;
     Torsional *torsion;
     
     done = 0;
     while(done == 0)
	  {
	  if(*(index) == 0)
	       {
	       atominfo = ChooseAtomFromAtom(zm,zc,atomused);
	       if(atominfo == 0)
		    done = -1;
	       else
		    {
		    *index = atominfo->ID;
		    (zm->Set + zm->NumberOfAtoms)->ID = *(index);
		    }
	       }
	  else if(*(index + 1) == 0 && zm->NumberOfAtoms > 0)
	       {
	       bond = ChooseAtomFromBond(index,zc,atomused,bondused);
	       if(bond == 0)
		    *(index    ) = 0;
	       else
		    {
		    (zm->Set + zm->NumberOfAtoms)->J = *(index + 1);
		    (zm->Set + zm->NumberOfAtoms)->BondLength = bond->BondLength;
		    }
	       }
	  else if(*(index + 2) == 0 && zm->NumberOfAtoms > 1)
	       {
	       angle = ChooseAtomFromAngle(index,zc,atomused,angleused);
	       if(angle == 0)
		    *(index + 1) = 0;
	       else
		    {
		    (zm->Set + zm->NumberOfAtoms)->K = *(index + 2);
		    (zm->Set + zm->NumberOfAtoms)->Angle = angle->Angle;
		    }
	       }
	  else if(*(index + 3) == 0 && zm->NumberOfAtoms > 2)
	       {
	       torsion = ChooseAtomFromTorsional(index,zc,atomused,torsionused);
	       if(torsion == 0)
		    *(index + 2) = 0;
	       else
		    {
		    (zm->Set + zm->NumberOfAtoms)->L = *(index + 3);
		    (zm->Set + zm->NumberOfAtoms)->Torsion = torsion->TorsionAngle;
		    }
	       }
	  else
	       done = 1;
	  }
     return(done);
     }

static void MarkUsed(INT index, INT *atomused)
     {
     *(atomused + index) = USED;
     }

static FFAtomInfo *ChooseAtomFromAtom(ZMatrix *zm,
				      ZCoordinates *zc,
				      INT *atomused)
     {
     INT i,count;
     FFAtomInfo *atominfo,*done;
     ZMatLine *zl;
     
     atominfo = zc->AtomInfo;
     done = 0;
     count = 0;
     while(done == 0 && count < zc->NumberOfAtoms)
	  {
	  if(*atomused == UNUSED)
	       {
	       *atomused = USED;
	       done = atominfo;
	       zl = zm->Set;
	       LOOPi(zm->NumberOfAtoms + 1)
		    {
		    if(zl->ID == atominfo->ID)
			 {
			 done = 0;
			 }
		    zl++;
		    }
	       }
	  count++;
	  atomused++;
	  atominfo++;
	  }
     return(done);
     }

static BondStretch *ChooseAtomFromBond(INT *index, ZCoordinates *zc,
				       INT *atomused,
				       INT *bondused)
     {
     INT count,new;
     BondStretch *bond,*done;
     
     done = 0;
     count = 0;
     while(done == 0 && count < zc->NumberOfBondStretches)
	  {
	  bond = SelectBondStretch(zc,index,
				   &new,
				   bondused);
	  if(bond != 0)
	       {
	       if(MemberUsed(new,atomused,zc->NumberOfAtoms))
		    {
		    *(index + 1) = new;
		    done = bond;
		    }
	       *(bondused + bond->ID - 1) = USED;
	       }
	  count++;
	  }
     return(done);
     }

static BondAngle *ChooseAtomFromAngle(INT *index, ZCoordinates *zc,
				      INT *atomused,
				      INT *angleused)
     {
     INT count,new;
     BondAngle *angle,*done;
     
     done = 0;
     while(done == 0 && count < zc->NumberOfBondAngles)
	  {
	  angle = SelectBondAngle(zc,index,
				   &new,
				   angleused);
	  if(angle != 0)
	       {
	       if(MemberUsed(new,atomused,zc->NumberOfAtoms))
		    {
		    *(index + 2) = new;
		    done = angle;
		    }
	       *(angleused + angle->ID - 1) = USED;
	       }
	  count++;
	  }
     return(done);
     }

static Torsional *ChooseAtomFromTorsional(INT *index, ZCoordinates *zc,
					  INT *atomused,
					  INT *angleused)
     {
     INT count,new;
     Torsional *angle,*done;
     
     done = 0;
     count = 0;
     while(done == 0 && count < zc->NumberOfBondAngles)
	  {
	  angle = SelectTorsional(zc,index,
				  &new,
				  angleused);
	  if(angle != 0)
	       {
	       if(MemberUsed(new,atomused,zc->NumberOfAtoms))
		    {
		    *(index + 3) = new;
		    done = angle;
		    }
	       *(angleused + angle->ID - 1) = USED;
	       }
	  count++;
	  }
     return(done);
     }

static INT MemberUsed(INT element, INT *vector, INT num)
     {
     INT count,done;
     
     if(*(vector + element - 1) == USED)
	  done = 1;
     else 
	  done = 0;
     return(done);
     }

static BondStretch *SelectBondStretch(ZCoordinates *zc, 
				      INT *indexvec,
				      INT *newindex,
				      INT *used)
     {
     BondStretch *bond,*done;
     INT count;
     
     bond = zc->BondStretchSet;
     done = 0;
     count = 0;
     *newindex = 0;
     while(done == 0 && count < zc->NumberOfBondStretches)
	  {
	  if(*used == UNUSED)
	       {
	       if(*indexvec == bond->I)
		    {
		    done = bond;
		    *newindex = bond->J;
		    }
	       else if(*indexvec == bond->J)
		    {
		    done = bond;
		    *newindex = bond->I;
		    }
	       }
	  used++;
	  bond++;
	  count++;
	  }
     return(done);
     }

static BondAngle *SelectBondAngle(ZCoordinates *zc,
				  INT *indexvec,
				  INT *newindex,
				  INT *used)
     {
     BondAngle *angle,*done;
     INT count,indexcount;
     
     angle = zc->BondAngleSet;
     done = 0;
     count = 0;
     *newindex = 0;
     while(done == 0 && count < zc->NumberOfBondAngles)
	  {
	  if(*used == UNUSED)
	       {
	       if(*indexvec == angle->J &&
		  *(indexvec +1) == angle->K)
		    {
		    done = angle;
		    *newindex = angle->I;
		    }
	       else if(*indexvec == angle->J &&
		  *(indexvec +1) == angle->I)
		    {
		    done = angle;
		    *newindex = angle->K;
		    }
	       else if(*indexvec == angle->I &&
		  *(indexvec +1) == angle->J)
		    {
		    done = angle;
		    *newindex = angle->K;
		    }
	       else if(*indexvec == angle->K &&
		  *(indexvec +1) == angle->J)
		    {
		    done = angle;
		    *newindex = angle->I;
		    }
	       }
	  
	  used++;
	  count++;
	  angle++;
	  }
     return(done);
     }

static Torsional *SelectTorsional(ZCoordinates *zc,
				  INT *indexvec,
				  INT *newindex,
				  INT *used)
     {
     Torsional *angle,*done;
     INT count,indexcount;
     
     angle = zc->TorsionalSet;
     done = 0;
     count = 0;
     *newindex = 0;
     while(done == 0 && count < zc->NumberOfTorsional)
	  {
	  if(*used == UNUSED)
	       {
	       if(*(indexvec    ) == angle->I &&
		  *(indexvec + 1) == angle->J &&
		  *(indexvec + 2) == angle->K )
		    {
		    done = angle;
		    *newindex = angle->L;
		    }
	       else if(*(indexvec    ) == angle->I &&
		  *(indexvec + 1) == angle->J &&
		  *(indexvec + 2) == angle->L )
		    {
		    done = angle;
		    *newindex = angle->K;
		    }
	       else if(*(indexvec    ) == angle->L &&
		  *(indexvec + 1) == angle->K &&
		  *(indexvec + 2) == angle->J )
		    {
		    done = angle;
		    *newindex = angle->I;
		    }
	       else if(*(indexvec    ) == angle->L &&
		  *(indexvec + 1) == angle->K &&
		  *(indexvec + 2) == angle->I )
		    {
		    done = angle;
		    *newindex = angle->J;
		    }
                else if(*(indexvec    ) == angle->K &&
		  *(indexvec + 1) == angle->I &&
		  *(indexvec + 2) == angle->J )
		    {
		    done = angle;
		    *newindex = angle->L;
		    }
	       else if(*(indexvec    ) == angle->L &&
		  *(indexvec + 1) == angle->I &&
		  *(indexvec + 2) == angle->J )
		    {
		    done = angle;
		    *newindex = angle->K;
		    }
	       else if(*(indexvec    ) == angle->I &&
		  *(indexvec + 1) == angle->K &&
		  *(indexvec + 2) == angle->L )
		    {
		    done = angle;
		    *newindex = angle->J;
		    }
	       else if(*(indexvec    ) == angle->J &&
		  *(indexvec + 1) == angle->K &&
		  *(indexvec + 2) == angle->L )
		    {
		    done = angle;
		    *newindex = angle->I;
		    }
	       }
	  used++;
	  count++;
	  angle++;
	  }
     return(done);
     }

