#! /bin/tcsh -f

set THERMODIR = $REACTROOT/data/tables
set SCRIPTS = $REACTROOT/programs/scripts

pushd $THERMODIR

$REACTROOT/programs/scripts/readthermotables.sh Table2.14
$REACTROOT/programs/scripts/readthermotables.sh TableA.1
$REACTROOT/programs/scripts/readthermotables.sh TableA.2
$REACTROOT/programs/scripts/readthermotables.sh TableA.2CO

# bensonorganize.sh test Table2.14  TableA.1  TableA.2  TableA.2CO
$REACTROOT/programs/scripts/bensonorganize.sh test Table2.14  TableA.1  TableA.2
#bensonorganize.sh test Table2.14  
popd
