static void ReadSpectraSet(CHAR *filename,FLOAT interval)
     {
     
     CHAR *filestring;
     INT mscount,i;
     FILE *mslist;
     SpectrumSet *specset;
     
     filestring = AllocateString(FILENAMESIZE);
     
     sprintf(filestring,"%s.nam.cor",filename);
     mslist = OpenReadFile(filestring,"",-1);
     
     mscount = CountSpectra(mslist);
     fclose(mslist);
     
     mslist = OpenReadFile(filestring,"",-1);
     
     specset = AllocateSpectrumSet;
     CreateSpectrumSet(specset,0,filename,
		       mscount,
		       0,0,0,0,0);
     
     ReadSpectra(mslist,specset,interval);
     fclose(mslist);
     
     SpectrumSetUpStandard(specset);

     Free(filestring);
     
     }

     
static void ReadSpectra(FILE *mslist, 
			SpectrumSet *specset,
			FLOAT interval)
     {
     INT i,count,error;
     CHAR *string, *filename, *line;
     Spectrum *spectrum;
     FILE *file;
     SpectrumSetData *data;
     
     string = AllocateString(FILENAMESIZE);
     filename = AllocateString(FILENAMESIZE);
     data = AllocateSpectrumSetData;
     specset->Data = AllocateSpectrumSetData;
     
     CreateSpectrumSetData(specset->Data,specset->ID,specset->Name,
			   SMALLFREQ,LARGEFREQ,
			   SMALLHEIGHT,LARGEHEIGHT,
			   interval);
     count = 0;
     spectrum = specset->Spectra;
     LOOPi(specset->NumberOfSpectra)
	  {
	  line = NextNonBlankLine(mslist,string);
	  *(line + 15) = ENDOFSTRING;
	  EliminateBlanks(line);
	  if(*line != '.')
	       {
	       sprintf(filename,"c%s.ms",line);
	       file = OpenReadFile(filename,"",-1);
	       error = ReadRobienSpectra(file,spectrum,data);
	       UpdateSetLimits(data,specset->Data);
	       if(!error)
		    {
		    count++;
		    }
	       fclose(file);
	       }
	  else 
	       CreateSpectrum(spectrum,-1,"-1",0,0);
	  spectrum++;
	  }
     Free(string);
     FreeSpectrumSetData(data);
     Free(data);
     }

static INT CountSpectra(FILE *mslist)
     {
     INT count;
     CHAR *string,*stop;
     
     
     string = AllocateString(LINELENGTH);
     
     count = 0;
     stop = NextNonBlankLine(mslist,string);
     while( stop != 0 )
	  {
	  stop = NextNonBlankLine(mslist,string);
	  count++;
	  }
     Free(string);
     
     return(count);
     }

static INT ReadRobienSpectra(FILE *file,
			     Spectrum *spectrum,
			     SpectrumSetData *data)
     {
     CHAR *line,*word,*string,*rest,*name;
     INT count,id,i;
     FLOAT f,h;
     SpectrumPair *pairstart,*pairs;
     
     string = AllocateString(NAMESIZE);
     word   = AllocateString(FILENAMESIZE);
          
     line = NextNonBlankLine(file,string);
     id = ConvertStringToInteger(line+6);
     
     line = NextNonBlankLine(file,string);
     
     line = NextNonBlankLine(file,string);
     EliminateBlanks(line);
     ConvertToUpper(line);
     name = CopyString(line);
     
     CreateSpectrumSetData(data,id,name,
			   SMALLFREQ,LARGEFREQ,
			   SMALLHEIGHT,LARGEHEIGHT,
			   0.0);
     line = NextNonBlankLine(file,string);
     count = 0;
     pairstart = pairs = AllocArraySpectrumPair(MAXIMUMSPECTRASIZE);
     while(line != 0)
	  {
	  rest = IsolateNextWord(line,word,';',FILENAMESIZE);
	  f = ConvertStringToFloat(word);

	  IsolateNextWord(rest,word,';',FILENAMESIZE);
	  h = ConvertStringToFloat(word);

	  UpdateLimits(f,h,data);
	  
	  CreateSpectrumPair(pairs,count,name,
			     f,h);
	  
	  pairs++;
	  count++;
	  line = NextNonBlankLine(file,string);
 	  }
     CreateSpectrum(spectrum,id,name,
		    count,pairstart);
     
     pairs = pairstart;
     LOOPi(count) FreeSpectrumPair(pairs++);
     Free(pairstart);
     
     return(0);
     
}


static SpectrumSetUpStandard(SpectrumSet *specset)
     {
     SpectrumSetData *data;
     FLOAT diff;
     INT count;
     
     data = specset->Data;
     specset->Standard = AllocateSpectrumSetStandard;
     diff = (data->LargestSetFrequency - data->SmallestSetFrequency);
     count = floor( diff/(data->Interval) + 1.5);
     CreateSpectrumSetStandard(specset->Standard,
			       specset->ID,
			       specset->Name,
			       data->SmallestSetFrequency,
			       data->LargestSetFrequency,
			       count,
			       data->Interval);

     ConvertSetToStandards(specset);

     }

