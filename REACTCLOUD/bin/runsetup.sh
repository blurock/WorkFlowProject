#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to setup up the chemdb.als for the file system
#   chemdb.als:
#       The default parameter specification
#
# ---------------------------------------------------------------------------
set verbose on
#--------------------------------------------------------------------------
# Set up inputs, files and program
#--------------------------------------------------------------------------
if ( $#argv >= 1 ) then
    set REACTROOT = $1
endif

set COMMANDDIR      = $REACTROOT/command
set CHEMDBALS       = $COMMANDDIR/chemdb.als
set BINDIR          = $REACTROOT/bin
set PROGDIR         = $REACTROOT/programs
set SETUPDIR        = $PROGDIR/setup
set SCRIPTDIR       = $PROGDIR/scripts
set TMPDIR          = $REACTROOT/tmp
set DATADIR         = $REACTROOT/data
set DBDIR           = $REACTROOT/data/DB

#--------------------------------------------------------------------------
#   Change executable permissions
chmod a+x $BINDIR/*.sh
chmod a+x $SETUPDIR/*.sh
chmod a+x $SCRIPTDIR/*.sh
#--------------------------------------------------------------------------
#  Set up some run directories
if(!(-f $TMPDIR)) then
	mkdir $TMPDIR
endif
if(!(-f $DBDIR)) then
	mkdir $DBDIR
endif
#--------------------------------------------------------------------------

cat << EOF > $CHEMDBALS
ROOT                   $REACTROOT
DATA                   $REACTROOT/data
DBDIRECTORY            $REACTROOT/data/DB
MOLDIR                 $REACTROOT/data/mol
RXNDIR                 $REACTROOT/data/rxn
PERFDIR                $REACTROOT/data/mech
TABLEDIR               $REACTROOT/data/tables

MOLECULEROOT           mol/molecule
REACTIONROOT           rxn/reaction
SUBSTRUCTUREROOT       mol/substructure

BENSONROOT             BensonStandard
BENSONTREEROOT         bensontree
CURRENT                .

DBDataDirectory               (DbaseOps)DBDataDirectory
DBDataMolRoot                 (DbaseOps.Molecules)DBDataMolRoot
DBDataSubstructureRoot        (DbaseOps.Substructures)DBDataSubstructureRoot
DBDirectory                   (CreateOpenClose)DBDirectory
TablesDataDirectory           (Tables)TablesDataDirectory
TablesOutputDirectory         (Tables)TablesOutputDirectory
RootMolName                   (Mol)RootMolName
MolDirectory                  (Mol)MolDirectory
MolOutName                    (Mol)MolOutName
MolOutDir                     (Mol)MolOutDir

exit(0)
