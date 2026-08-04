COMMAND MoleculeSpectra SPECTRACALCULATIONS
TITLE Molecular Spectra Calculations and Management
          ARGUMENTS
                INT_VALUE    MaximumNumberOfIntervals
                    TITLE   The Maximum number of intervals allowed
                    DEFAULT 8
                INT_VALUE    MinimumNumberOfIntervals
                    TITLE   The Minimum number of intervals allowed
                    DEFAULT 3
                FLOAT_VALUE    IntervalIncrement
                    TITLE   The defaule interval increment
                    DEFAULT 0.01
          END_ARGUMENTS
          COMMAND Atom SPECMOLECULECALCULATE
               TITLE From Current Set of Molecules, Compute ATOM SE-Spectra Set
               FUNCTION ComputeMoleculeSpectraSet
          ENDCOMMAND
          COMMAND Bond SPECMOLBONDCALCULATE
               TITLE From Current Set of Molecules, Compute BOND SE-Spectra Set
               FUNCTION ComputeMoleculeBondSpectraSet
          ENDCOMMAND
          COMMAND TotalSet TOTALSPECCALCULATE
               TITLE From Current Set of Molecules, compute all spectral quantities
               FUNCTION ComputeMoleculeSpectraTotalSet
          ENDCOMMAND
          COMMAND Print SPECTRAPRINT
               TITLE Print Out Spectral Data
               FUNCTION PrintSpectraSet
          ENDCOMMAND
ENDCOMMAND
DONE
