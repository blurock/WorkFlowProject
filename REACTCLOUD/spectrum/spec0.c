/*  FILE     spec0.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    The basic spectra producing routines
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
#include "spec0.h"
#include <math.h>

static void SpecDataFromSpectrum(SpectrumSetData *data,
				 Spectrum *spec);
static void UpdateLimits(FLOAT f, FLOAT h, SpectrumSetData *data);
static void UpdateSetLimits(SpectrumSetData *data,
			    SpectrumSetData *setdata);
static void ConvertToStandardSpectrum(SpectrumStandard *standard,
				      Spectrum *spectrum,
				      SpectrumSetStandard *specs);
static void DifferenceSpectrum(SpectrumStandard *standard,
			       Spectrum *spectrum,
			       SpectrumSetStandard *specs,
			       FLOAT MinimumDifference);
static int CompareFrequencies(SpectrumPair *pair1,
			      SpectrumPair *pair2);
static void OrderSpectrumLines(Spectrum *spectrum);

#include "spectrum/spec.c"

extern void ComputeSpectrumSetData(SpectrumSet *specset)
     {
     SpectrumSetData *data;
     Spectrum *spectrum;
     INT i;
     
     data = AllocateSpectrumSetData;
     
     specset->Data = AllocateSpectrumSetData;
     CreateSpectrumSetData(specset->Data,specset->ID,specset->Name,
			   SMALLFREQ,LARGEFREQ,
			   SMALLHEIGHT,LARGEHEIGHT,
			   DEFAULTINTERVAL);

     spectrum = specset->Spectra;
     LOOPi(specset->NumberOfSpectra)
	  {
	  SpecDataFromSpectrum(data,spectrum);
	  UpdateSetLimits(data,specset->Data);
	  spectrum++;
	  }
     FreeSpectrumSetData(data);
     }

static void SpecDataFromSpectrum(SpectrumSetData *data,
				 Spectrum *spec)
     {
     SpectrumPair *pnt;
     INT i;
     
     CreateSpectrumSetData(data,spec->ID,spec->Name,
			   SMALLFREQ,LARGEFREQ,
			   SMALLHEIGHT,LARGEHEIGHT,
			   DEFAULTINTERVAL);

     pnt = spec->Points;
     LOOPi(spec->NumberOfPoints)
	  {
	    printf("Spectral Points: %20s: %10f %10f\n",
		   pnt->Name,pnt->Frequency,pnt->PeakHeight); 
	  UpdateLimits(pnt->Frequency,pnt->PeakHeight,data);
	  pnt++;
	  }
     
     }

static void UpdateLimits(FLOAT f, FLOAT h, SpectrumSetData *data)
     {
     
     if(data->LargestSetFrequency < f)
	  {
	  data->LargestSetFrequency = f;
	  }
     if(data->SmallestSetFrequency > f)
	  {
	  data->SmallestSetFrequency = f;
	  }
     if(data->LargestSetHeight < h)
	  {
	  data->LargestSetHeight = h;
	  }
     if(data->SmallestSetHeight > h)
	  {
	  data->SmallestSetHeight = h;
	  }
     }

static void UpdateSetLimits(SpectrumSetData *data,
			   SpectrumSetData *setdata)
     {
     
     if(setdata->LargestSetFrequency < data->LargestSetFrequency)
	  {
	  setdata->LargestSetFrequency = data->LargestSetFrequency;
	  }
     if(setdata->SmallestSetFrequency > data->SmallestSetFrequency)
	  {
	  setdata->SmallestSetFrequency = data->SmallestSetFrequency;
	  }
     if(setdata->LargestSetHeight < data->LargestSetHeight)
	  {
	  setdata->LargestSetHeight = data->LargestSetHeight;
	  }
     if(setdata->SmallestSetHeight > data->SmallestSetHeight)
	  {
	  setdata->SmallestSetHeight = data->SmallestSetHeight;
	  }
     }

extern void ConvertSetToStandard(Spectrum *spectrum,
				 SpectrumStandard *standard,
				 SpectrumSetStandard *specinfo,
				 INT numspectra)
     {
     INT i;
     
     LOOPi(numspectra)
	  {
	  if(spectrum->NumberOfPoints > 0)
	       {
	       ConvertToStandardSpectrum(standard,spectrum,specinfo);
	       }
	  else
	       CreateSpectrumStandard(standard,-1,"-1",0,0);
	  standard++;
	  spectrum++;
	  }
     }

extern void ConvertSetToDifference(Spectrum *spectrum,
				   SpectrumStandard *difference,
				   SpectrumSetStandard *specinfo,
				   INT numspectra)
     {
     INT i;
     
     LOOPi(numspectra)
	  {
	  if(spectrum->NumberOfPoints > 0)
	       {
	       DifferenceSpectrum(difference,spectrum,specinfo,
				  MINIMUM_DISTANCE);
	       }
	  else
	       CreateSpectrumStandard(difference,-1,"-1",0,0);
	  
	  difference++;
	  spectrum++;
	  }
     }

#define EPSILON   0.01

static void ConvertToStandardSpectrum(SpectrumStandard *standard,
				      Spectrum *spectrum,
				      SpectrumSetStandard *specs)
     {
     FLOAT current,*freq,height,epsilon;
     INT i,count,cnt;
     SpectrumPair *samplefreq;
     
     OrderSpectrumLines(spectrum);

     CreateSpectrumStandard(standard,spectrum->ID,spectrum->Name,
			    specs->NumberOfIntervals,
			    0);
     
     epsilon = EPSILON * specs->Interval;
     current = specs->BeginFrequency + epsilon;
     freq = standard->Heights;
     samplefreq = spectrum->Points;
     count = spectrum->NumberOfPoints;
     LOOPi(specs->NumberOfIntervals)
	  {
	  height = 0.0;
	  cnt = 0;
	  while(samplefreq->Frequency <= current &&
		count > 0)
	       {
	       height += samplefreq->PeakHeight;
	       cnt++;
	       samplefreq++;
	       count--;
	       }
	  if(cnt > 0)
	       {
	       *freq++ = height;
/*	       *freq++ = height / ((FLOAT) cnt); */
	       }
	  else
	       {
	       *freq++ = 0.0;
	       }
		    
	  current += specs->Interval;
	  }
     }

static void DifferenceSpectrum(SpectrumStandard *standard,
			       Spectrum *spectrum,
			       SpectrumSetStandard *specs,
			       FLOAT MinimumDifference)
     {
     FLOAT *freq,begin,interval,diff;
     INT i,j,new;
     SpectrumPair *samplefreq,*freqdiff;

     OrderSpectrumLines(spectrum);

     CreateSpectrumStandard(standard,spectrum->ID,spectrum->Name,
			    specs->NumberOfIntervals,
			    0);
     
     begin = specs->BeginFrequency;
     interval = specs->Interval;

     freq = standard->Heights;
     LOOPi(standard->NumberOfFrequencies)
	  *freq++ = 0.0;
     
     freq = standard->Heights;
     samplefreq = spectrum->Points;
     LOOPi(spectrum->NumberOfPoints)
	  {
	  freqdiff = spectrum->Points;
	  LOOPj(i)
	       {
	       diff = samplefreq->Frequency - freqdiff->Frequency;
	       if(diff > MinimumDifference)
		    {
		    new = floor( (diff - begin) / interval );
		    if(samplefreq->PeakHeight > freqdiff->PeakHeight)
			 *(freq + new) += freqdiff->PeakHeight;
		    else
			 *(freq + new) += samplefreq->PeakHeight;
		    }
	       freqdiff++;
	       }
	  samplefreq++;
	  }
     }
	  
static int CompareFrequencies(SpectrumPair *pair1,
			      SpectrumPair *pair2)
     {
     if(pair1->Frequency < pair2->Frequency)
	  return(-1);
     else if(pair1->Frequency > pair2->Frequency)
	  return(1);
     else
	  return(0);
     }

	  
static void OrderSpectrumLines(Spectrum *spectrum)
     {
     qsort(spectrum->Points, 
	   spectrum->NumberOfPoints,
	   SpectrumPairSize,
	   CompareFrequencies);
     }

