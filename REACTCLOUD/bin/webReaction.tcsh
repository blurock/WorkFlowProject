# webReaction setup for tcsh
#set verbose on

# The top directory is the top directory of eclipse workspace
# The rest of the environment variables should follow from this.

setenv REACTWORKSPACE $1

# ================================================================
# Most likely you do not need to modify below this line.
# But if the location of the subsystems have been moved, then these can be modified
# ================================================================

# REACT subsystem
setenv CCROOT    $REACTWORKSPACE/REACT
setenv REACTROOT $REACTWORKSPACE/REACT


# ================================================================
# These locations are inherent to the system and should never be touched.
# ================================================================

# --------------------------------------------------------------
# REACT subsystem
# --------------------------------------------------------------
setenv REACTBIN     $REACTROOT/bin
setenv REACTSCRIPTS $REACTROOT/programs/scripts

set path=($path $REACTBIN $REACTSCRIPTS)

# ================================================================
# Environment Variables for AnalysisDevelop
# ================================================================
setenv CodeBaseRoot     $REACTWORKSPACE/AnalysisStable
setenv ANALYSIS_BASE    $CodeBaseRoot
setenv ANALYSIS_DEVBASE $REACTWORKSPACE/AnalysisDevelop
setenv ANALYSIS_BINARY  $REACTWORKSPACE/AnalysisBinaries

set path = ($path $ANALYSIS_BINARY)
