#include "basic.h"

#include "strmas.h"

KeyWords TypeKeys[] = {
{"INT",TypeINT,0,0},
{"FLOAT",TypeFLOAT,0,0},
{"CHAR",TypeCHAR,0,0},
{"STRING",TypeSTRING,0,0},
{"LL",TypeLL,0,0},
{"BYTE",TypeBYTE,0,0},
{"FILE",TypeFILE,0,0},
{"SYMBOL",TypeSYMBOL,0,0},
{"FUNCTION",TypeFUNCTION,0,0},
{"NAME",TypeNAME,0,0} };

StructureType Types[] = {
     {0,"Integer",TypeINT,"INT","%d",ON},
     {1,"Floating",TypeFLOAT,"FLOAT","%f",ON},
     {2,"Character",TypeCHAR,"CHAR","%c",ON},
     {3,"String",TypeSTRING,"STRING","%s",OFF},
     {4,"Linked List",TypeLL,"LL","%d",OFF},
     {5,"Byte",TypeBYTE,"BYTE","%d",ON},
     {6,"File",TypeFILE,"FILE","%d",ON},
     {7,"Symbol",TypeSYMBOL,"SYMBOL","%s",OFF},
     {8,"Function",TypeFUNCTION,"FUNCTION","%d",ON},
     {9,"Name",TypeNAME,"NAME","%s",OFF} };

KeyWords StructureKeys[] = {
{"Pointer",KeyPNTR,0,0},
{"Array",KeyARRAY,0,0},
{"Create",KeyCREATE,0,0},
{"Return",KeyRETURN,0,0} };

CHAR Blanks[] = "                                                     ";

