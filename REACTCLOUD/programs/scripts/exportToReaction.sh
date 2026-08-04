#!/bin/tcsh
# ---------------------------------------------------------------------------
#
# Script to transfer CHEMKIN and structures to REACTION
#
# ---------------------------------------------------------------------------
set verbose on

#--------------------------------------------------------------------------
if($#argv < 1) then
    echo "Expecting: $0 root "
    echo "      root:  The root name of the set being exported"
    exit(1)
endif

set CHEMPROG        = $REACTROOT/bin/runchem.sh
set EXPORT          = $REACTROOT/programs/inputs/ExportMolecules.inp
set TEMPDIR         = $REACTROOT/tmp
set MOLDIR          = $REACTROOT/data/mol/molsdf

set ROOT            = $1

if(!(-f $MOLDIR/$ROOT.mol)) then
    echo "Expected '$MOLDIR/$ROOT.mol' for list of molecules to transfer"
    exit(1)
endif


cp $MOLDIR/$ROOT.mol $ROOT.mol
cp $MOLDIR/$ROOT.mol molecules.lst

$CHEMPROG $ROOT < $EXPORT

rm $ROOT.mol

cat <<EOF > MoleculeTransfer.inp
Transfer of Molecule Set Information
Attributes:
%% ------------------------------------
%% InstanceNameList  KeyWords
%% ------------------------------------
EOF
cat molecules.lst >>  MoleculeTransfer.inp
cat <<EOF >> MoleculeTransfer.inp
END
%% ------------------------------------
%% ToMove       KeyWords
%% ------------------------------------
FromInstance  StoreMoleculeProperty Molecule 
Chemkin MoleculeChemkin 
ShortName ChemkinName
ChemkinName ShortName
MoleculeKeys Keys
Eps          Eps
Sig          Sig
Dipole       Dipole
Polarize     Polarize
ZRotation    ZRotation
END
%% ------------------------------------
END

EOF
