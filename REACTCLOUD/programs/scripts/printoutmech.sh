#! /bin/tcsh -f

#--------------------------------------------------------------------------
if($#argv < 1) then
    echo "Expecting: $0 root [MechanismNames]"
    echo "      root:  The root name of the output files produced"
    echo "      MechanismNames:  The list of mechanism names"
    exit(1)
endif

set ROOTNAME        = $1
shift

set TEMPLIST = mech.lst

if(-f $TEMPLIST) then
  rm $TEMPLIST
endif

touch $TEMPLIST

while($#argv > 1)
    echo $1 >> $TEMPLIST
    shift
end

set REACTROOT = $1
echo $REACTROOT

mv $TEMPLIST $REACTROOT/tmp/mech.lst

set TEMPDIR         = $REACTROOT/tmp
set TEMPPROG        = $REACTROOT/tmp/mech.prg
set TEMPLIST        = $REACTROOT/tmp/mech.lst
set TEMPSDF         = $REACTROOT/tmp/mech.sdf
set TEMPTHM         = $REACTROOT/tmp/mech.thm
set TEMPMECH        = $REACTROOT/tmp/mech.mech
set TEMPCORRS       = $REACTROOT/tmp/mech.corrs
set SDF             = $ROOTNAME.sdf
set THM             = $ROOTNAME.thm
set MECH            = $ROOTNAME.mech
set CORRS           = $ROOTNAME.corrs
set PROG            = $REACTROOT/bin/runchemprg.sh


cat <<EOF >! $TEMPPROG
CreateOpenClose
Start
Quit
DbaseOps
Mechanisms
Parameters
MechDirectory
Input
.
Quit
Quit
Retrieve
Print
Quit
Quit
Quit
EOF

pushd $TEMPDIR
$PROG mech
popd

cp $TEMPSDF $SDF
cp $TEMPTHM $THM
cp $TEMPMECH $MECH
cp $TEMPCORRS $CORRS

echo EndOfOutput
