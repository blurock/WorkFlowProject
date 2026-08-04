#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to run a chain reaction on a specific molecule
#
# ---------------------------------------------------------------------------
#set verbose on

if ( $#argv < 3 ) then
  echo "Usage: readmol.sh File"
  echo "        Root     :    The root name of the chain definition file"
  echo "        Molecule :    The molecule name (from database)"
  echo "        Mechanism :   The name of the generated mechanism"
  exit(1)
endif
echo REACTROOT = $REACTROOT
#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
set ROOTNAME        = $1
set MOLECULE        = $2
set MECHNAME        = $3
set ROOTDIR         = $PWD
#--------------------------------------------------------------------------
# CallChain.inp:      The REACTION commands
# runchemprg.sh       The script to run REACTION
#--------------------------------------------------------------------------
set REFERENCE       = $REACTROOT/programs/inputs/CallChain.inp
set CHEMPROG        = $REACTROOT/bin/runchemprg.sh
#--------------------------------------------------------------------------
# The temporary directory (used during run)
#    read.prg:   The modified REACTION commands with the molecule replaced
#    read.lsr:   The chain information
#--------------------------------------------------------------------------
set TEMPDIR         = $REACTROOT/tmp
set TEMPFILE1       = $REACTROOT/tmp/read0.prg
set TEMPFILE2       = $REACTROOT/tmp/read.prg
set TEMPCHAIN       = $REACTROOT/data/read.lsr

#--------------------------------------------------------------------------
# Modify Input file
#--------------------------------------------------------------------------
sed "s/XXXXXXXXXX/$MOLECULE/g"\
        $REFERENCE >! $TEMPFILE1

sed "s/YYYYYYYYYY/$MECHNAME/g"\
        $TEMPFILE1 >! $TEMPFILE2

cp $ROOTNAME.lsr $TEMPCHAIN
echo $ROOTNAME.lsr >  run.out
cat  $ROOTNAME.lsr >> run.out
#--------------------------------------------------------------------------
# Put Molecules in Database
#--------------------------------------------------------------------------
pushd $TEMPDIR
echo "in temp directory: $TEMPDIR" > readxxx.prg
rm core.*
set ERROR = 0
echo "runchain.sh " 
pwd
echo $REACTROOT

$CHEMPROG read >& $MECHNAME.out
grep ERROR $MECHNAME.out

echo "runchain.sh done running"  >> readxxx.prg
mv $MECHNAME.out $ROOTDIR/$MECHNAME.out
if(-f $MECHNAME.thm) then
    mv $MECHNAME.thm $ROOTDIR/$MECHNAME.thm
    echo "runchain.sh $MECHNAME.thm $ROOTDIR/$MECHNAME.thm"  >> readxxx.prg
else
    set ERROR = 1
endif
if(-f $MECHNAME.sdf) then
   mv $MECHNAME.sdf $ROOTDIR/$MECHNAME.sdf
    echo "runchain.sh $MECHNAME.sdf $ROOTDIR/$MECHNAME.sdf"  >> readxxx.prg
else
   set ERROR = 1
endif

if(-f $MECHNAME.corrs) then
   mv $MECHNAME.corrs $ROOTDIR/$MECHNAME.corrs
    echo "runchain.sh $MECHNAME.corrs $ROOTDIR/$MECHNAME.corrs"  >> readxxx.prg
else
   set ERROR = 1
endif

if(-f $MECHNAME.mech) then 
   mv $MECHNAME.mech $ROOTDIR/$MECHNAME.mech
    echo "runchain.sh $MECHNAME.mech $ROOTDIR/$MECHNAME.mech "  >> readxxx.prg
else
    set ERROR = 1
endif
echo "remove core if one" >> readxxx.prg
ls >> readxxx.prg
echo "end of list" >> readxxx.prg
#if(-f core.*) then 
#    set ERROR = 1
#    rm core.*
#endif
echo "TEMPCHAIN" >> readxxx.prg

echo "TEMPCHAIN: $TEMPCHAIN" >> readxxx.prg
cat $TEMPCHAIN >> readxxx.prg

echo "runchain.sh now removing"   >> readxxx.prg
#rm $TEMPFILE1
#rm $TEMPFILE2
#rm $TEMPCHAIN
if($ERROR == 1) then 
    echo "ERROR IN RUN"
endif

popd
 
echo EndOfOutput
