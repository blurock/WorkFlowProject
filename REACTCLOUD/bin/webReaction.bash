# webReaction setup for bash

# The top directory is the top directory of eclipse workspace
# The rest of the environment variables should follow from this.

export REACTWORKSPACE=$1

# ================================================================
# Most likely you do not need to modify below this line.
# But if the location of the subsystems have been moved, then these can be modified
# ================================================================

# REACT subsystem
export CCROOT=$REACTWORKSPACE/REACT
export REACTROOT=$REACTWORKSPACE/REACT


# ================================================================
# These locations are inherent to the system and should never be touched.
# ================================================================

# --------------------------------------------------------------
# REACT subsystem
# --------------------------------------------------------------
REACTBIN=$REACTROOT/bin
REACTSCRIPTS=$REACTROOT/programs/scripts

export PATH=$PATH:$REACTBIN:$REACTSCRIPTS

# ================================================================
# Environment Variables for AnalysisDevelop
# ================================================================
export CodeBaseRoot=$REACTWORKSPACE/AnalysisStable
export ANALYSIS_BASE=$Code_Base_Root
export ANALYSIS_DEVBASE=$REACTWORKSPACE/AnalysisDevelop
export ANALYSIS_BINARY=$REACTWORKSPACE/AnalysisBinaries
export PATH=$PATH:$ANALYSIS_BINARY
