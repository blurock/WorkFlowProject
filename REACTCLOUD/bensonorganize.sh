#! /bin/tcsh -f

#--------------------------------------------------------------------------
set TEMPDIR         = $REACTROOT/tmp
set TEMPPROG        = $REACTROOT/tmp/benson.prg
set TEMPLIST        = $REACTROOT/data/tables/BensonStandard.lst
set TEMPOUT         = $REACTROOT/tmp/benson.out
set PROG            = $REACTROOT/bin/runchemprg.sh
set INPUTCOMMANDS   = $REACTROOT/programs/inputs/BensonOrganize.inp

if(-f $TEMPLIST) then
  rm $TEMPLIST
endif

touch $TEMPLIST

while($#argv > 0)
    echo $1 >> $TEMPLIST
    shift
end
cp $INPUTCOMMANDS $TEMPPROG

pushd $TEMPDIR
$PROG benson

echo "----------------------------------------------"
#cat $TEMPOUT
echo "----------------------------------------------"
popd
