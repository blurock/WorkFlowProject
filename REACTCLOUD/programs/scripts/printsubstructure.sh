#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to print a substructure from the database
#
# ---------------------------------------------------------------------------

if ( $#argv < 1 ) then
    echo "Usage: $0 <substructure-name>"
    exit 1
endif

if ( ! $?REACTROOT ) then
    set SCRIPT_DIR = `dirname "$0"`
    setenv REACTROOT `cd "$SCRIPT_DIR/../.." && pwd`
endif

if ( ! $?REACT_USER_UID ) then
    setenv REACT_USER_UID "UOqk0KtFtaXma5TGsi8Seh9RMbx1"
endif

if ( ! $?REACT_IPC_SECRET ) then
    setenv REACT_IPC_SECRET "react-cloud-internal-ipc-shared-secret"
endif

set CHEMPROG        = $REACTROOT/bin/runchem.sh
set INPPRINT        = $REACTROOT/programs/inputs/PrintSubstructure.inp
set TEMPDIR         = $REACTROOT/tmp

pushd $TEMPDIR >& /dev/null

sed "s/xxxxx/$1/g" $REACTROOT/programs/inputs/Molecule.inp >! xxx.mol

echo "------------------------------------"
cat xxx.mol
echo "------------------------------------"

$CHEMPROG test < $INPPRINT >! substructure.out
if ( -f molecule.out ) then
    cat molecule.out
    rm molecule.out
else
    echo "No molecule.out output found. Execution log:"
    cat substructure.out
endif
rm -f substructure.out
rm -f xxx.mol
popd
echo "EndOfOutput"
