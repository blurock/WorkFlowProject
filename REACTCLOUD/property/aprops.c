/*  File     aprops.c
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
#include "property.h"

#include "property/asciiprop.c"

/*S Initialize
*/

extern CHAR *ReadInPropertyInfoSDF(FILE *file, CHAR *line, ASCIIProperties *propset)
     {
     CHAR *name;
     INT len;
     ASCIIProperty *prop;
     
     name = AllocateString(LINELENGTH);
     
     CreateASCIIProperties(propset,0,0,
			   MAX_ASCII_PROPERTIES,0);
     propset->NumberOfProperties = 0;
     
     NextNonBlankLine(file,line);

     prop = propset->Properties;
     while(*line == '>' && propset->NumberOfProperties < MAX_ASCII_PROPERTIES )
	  {
	  len = strlen(line) - 5;
	  if(len > 0)
	       {
	       strncpy(name,line+4, (unsigned int) len);
	       *(name + len) = '\0';
	       
	       NextNonBlankLine(file,line);
	       CreateASCIIProperty(prop,propset->NumberOfProperties,name,
				   line);
	       
	       prop++;
	       propset->NumberOfProperties += 1;
	       }
	  
	  NextNonBlankLine(file,line);
	  }
     Free(name);

     return(line);
     }

/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern void FillInASCIIValue(ASCIIProperties *asciipropset,
			     SetOfPropertyValues *propset,
			     SetOfPropertyTypes *types,
			     BindStructure *bind)
     {
     ASCIIProperty *asciiprop;
     INT i;
     
     if(asciipropset != 0)
	  {
	  asciiprop = asciipropset->Properties;
	  LOOPi(asciipropset->NumberOfProperties)
	       {
	       FillInPropertyValueFromStringFromName(asciiprop->PropertyValue,
						     asciiprop->Name,
						     propset,
						     types,
						     bind);
	       asciiprop++;
	       }
	  }
     }

/*f props = FillInProperties(file,rxn)
**
**  DESCRIPTION
**    file: The file from which to read
**    line: The next line that is not a property
**
**    A property is some information about the object
**    that is on one line begining with a dash (blanks can preceed),
**    the property name, one or more blank and then the property.
**
**    The return is the next line that is not a property.  If the
**    end of the file, then it is zero, otherwise it is the 
**    first line of the next reaction.
**
**
**  REMARKS
**
*/
extern CHAR *FillInProperties(FILE *file, ASCIIProperties *props,CHAR *string)
     {
     CHAR *line,*word,*rest;
     INT count,done;
     ASCIIProperty *prop;
     
     word = AllocateString(PRINT_BUFFER_LENGTH);
     
     CreateASCIIProperties(props,0,0,
			   MAX_ASCII_PROPERTIES,0);
     
     props->NumberOfProperties = 0;
     done = 0;
     prop = props->Properties;
     while(done == 0 && props->NumberOfProperties < MAX_ASCII_PROPERTIES)
	  {
	  line = NextNonBlankLine(file,string);
	  if(line != 0)
	       {
	       line = EliminateLeadingBlanks(line);
	       if(*line == '-')
		    {
		    rest = line+1;
		    rest = EliminateLeadingBlanks(rest);
		    
		    rest = IsolateNextWord(rest,word,BLANK,PRINT_BUFFER_LENGTH);
		    rest = EliminateLeadingBlanks(rest);
		    
		    CreateASCIIProperty(prop,count,word,rest);
		    prop++;
		    props->NumberOfProperties += 1;
		    }
	       else
		    done = 1;
	       }
	  else
	       done = 1;
	  }

     Free(word);
     return(line);
     }

 
/*F asciiprops = ReadInListOfNamesAndProps(file,max,delimitor)
**
**  DESCRIPTION
**    Reads in a list of Names of the form:
**       Name (delimitor) Information
**
**    If the delimitor is zero, then the entire Name is put into the Name
**    portion of the ASCIIProperty structure
**  
**   The first line is the name of the list
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern ASCIIProperties *ReadInListOfNamesAndProps(FILE *file,
						  INT max,
						  CHAR delimitor)
     {
     ASCIIProperties *aprops;
     ASCIIProperty *prop;
     CHAR *string, *line, *word, *rest;
     
     word = AllocateString(LINELENGTH);
     string = AllocateString(LINELENGTH);
     
     aprops = AllocateASCIIProperties;
     CreateASCIIProperties(aprops,0,0,max,0);
     aprops->NumberOfProperties = 0;
     
     line = NextNonBlankLine(file,string);
     aprops->Name = CopyString(line);
     
     line = NextNonBlankLine(file,string);
     prop = aprops->Properties;
     while(line != 0 && aprops->NumberOfProperties < max)
	  {
	  if(delimitor != 0)
	       {
	       rest = IsolateNextWord(line,word,delimitor,LINELENGTH);
	       CreateASCIIProperty(prop,aprops->NumberOfProperties,word,rest);
	       }
	  else
	       {
	       CreateASCIIProperty(prop,aprops->NumberOfProperties,line,0);
	       }
	  aprops->NumberOfProperties += 1;
	  line = NextNonBlankLine(file,string);
	  prop++;
	  }
     Free(word);
     Free(string);
     
     return(aprops);
     }

/*F asciiprops = ReadListFromLine(line,max,setdelimitor,namedelimitor)
**
**  DESCRIPTION
**    Reads in a list of Names of the form:
**       Name1 (namedelimitor) Information1 (setdelimitor) Name2 (namedelimitor) ...
**
**    If the namedelimitor is zero, then the entire Name is put into the Name
**    portion of the ASCIIProperty structure and the data is zero
**  
**   The first line is the name of the list
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern ASCIIProperties *ReadListFromLine(CHAR *line,
					 INT max,
					 CHAR setdelimitor,
					 CHAR namedelimitor)
     {
     ASCIIProperties *aprops;
     ASCIIProperty *prop;
     CHAR *name, *word, *rest, *data;
     
     word = AllocateString(LINELENGTH);
     name = AllocateString(LINELENGTH);

     aprops = AllocateASCIIProperties;
     CreateASCIIProperties(aprops,0,0,max,0);
     aprops->NumberOfProperties = 0;
     
     prop = aprops->Properties;
     rest = line;
     while(strlen(rest) != 0 && aprops->NumberOfProperties < max)
	  {
	  rest = IsolateNextWord(rest,word,setdelimitor,LINELENGTH);
	  if(namedelimitor != 0)
	       {
	       data = IsolateNextWord(word,name,namedelimitor,LINELENGTH);
	       CreateASCIIProperty(prop,aprops->NumberOfProperties,name,data);
	       }
	  else
	       CreateASCIIProperty(prop,aprops->NumberOfProperties,word,0);

	  aprops->NumberOfProperties += 1;
	  prop++;
	  }
     Free(word);
     Free(name);
     
     return(aprops);
     }

