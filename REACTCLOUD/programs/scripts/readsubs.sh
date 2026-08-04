#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to Read in a new substructure file to the database
#
# ---------------------------------------------------------------------------
#set verbose on

if ( $#argv != 1 ) then
  echo "Usage: $0 FileRoot"
  echo "    FileROOT     :    The substructure information file (rootname without sdf extension)"
  echo "                      The file is assumed to be in the current directory"
  exit(1)
endif

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
# The program and the input file pattern
set CHEMPROG        = $REACTROOT/bin/runchem.sh
set REFERENCE       = $REACTROOT/programs/inputs/ReadSubsFromFile.inp

# The current input file and the standard (established) input file
set NEWFILE         = $1

# The combined input file (all the substructures are formed again)
set STANDARDSUBFILE = standard
set STANDARD        = $REACTROOT/data/mol/subs/standard.sdf


set TEMPDIR         = $REACTROOT/tmp
set TEMPFILE        = $REACTROOT/tmp/read.prg
set TEMPOUTFILE     = $REACTROOT/tmp/read.out
set INFILE          = $NEWFILE.sdf

#--------------------------------------------------------------------------
# Modify program and merge input data files
#--------------------------------------------------------------------------
sed "s/XXXXX/$NEWFILE/g"\
        $REFERENCE >! $TEMPFILE
cat $INFILE > $STANDARD

#--------------------------------------------------------------------------
# Put Substructures in Database
#--------------------------------------------------------------------------
pushd $TEMPDIR
$CHEMPROG read < read.prg
rm $TEMPFILE
popd

mv $TEMPOUTFILE $NEWFILE.out



