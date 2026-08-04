#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to combine a set of mechanisms
#
# ---------------------------------------------------------------------------
set verbose on

if ( $#argv < 1 ) then
  echo "Usage: readmol.sh File"
  echo "        Root     :    The root name of the mechanism files"
  echo "        MechName :    The name of the mechanism to be created"
  exit(1)
endif

#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set ROOTNAME        = $1
set MECHNAME        = $2
set ROOTDIR         = $PWD

#--------------------------------------------------------------------------
# CombineMechanisms.inp:      The REACTION commands
# runchemprg.sh               The script to run REACTION
#--------------------------------------------------------------------------
set REFERENCE       = $REACTROOT/programs/inputs/CombineMechanisms.inp
set CHEMPROG        = $REACTROOT/bin/runchemprg.sh
#--------------------------------------------------------------------------
# The temporary directory (used during run)
#    read.prg:   The modified REACTION commands with the molecule replaced
#    read.lst:   The mechanism information
#--------------------------------------------------------------------------
set TEMPDIR        = $REACTROOT/tmp
set TEMPFILE1      = $REACTROOT/tmp/read0.prg
set TEMPFILE       = $REACTROOT/tmp/read.prg
set TEMPMECH       = $REACTROOT/tmp/$ROOTNAME.lst
#--------------------------------------------------------------------------
# Modify Input file
#--------------------------------------------------------------------------
sed "s/XXXXXXXXXX/$ROOTNAME/g"\
        $REFERENCE >! $TEMPFILE1

sed "s/YYYYYYYYYY/$MECHNAME/g"\
        $TEMPFILE1 >! $TEMPFILE

#--------------------------------------------------------------------------
# Transfer mechanism list
#--------------------------------------------------------------------------
cp $ROOTNAME.lst $TEMPMECH

#--------------------------------------------------------------------------
# Transfer to temporary directory and run
#--------------------------------------------------------------------------
pushd $TEMPDIR
$CHEMPROG read > $MECHNAME.out

set ERROR = 0

mv $MECHNAME.out $ROOTDIR/$MECHNAME.out
if(-f $MECHNAME.thm) then
    mv $MECHNAME.thm $ROOTDIR/$MECHNAME.thm
else
    set ERROR = 1
endif
if(-f $MECHNAME.sdf) then
   mv $MECHNAME.sdf $ROOTDIR/$MECHNAME.sdf
else
   set ERROR = 1
endif

if(-f $MECHNAME.corrs) then
   mv $MECHNAME.corrs $ROOTDIR/$MECHNAME.corrs
else
   set ERROR = 1
endif

if(-f $MECHNAME.mech) then 
   mv $MECHNAME.mech $ROOTDIR/$MECHNAME.mech
else
    set ERROR = 1
endif

if(-f core.*) then 
    set ERROR = 1
    rm core.*
endif

if($ERROR == 1) then 
    echo "ERROR IN RUN"
endif

#rm $TEMPFILE
rm $TEMPFILE1
#rm $TEMPMECH

popd
 
echo EndOfOutput
