#!/bin/bash
# ---------------------------------------------------------------------------
# initialize_reaction_patterns.sh
#
# Erases current Reaction Patterns & DB-Index-PatternIDs classifications
# in Firestore, initializes metadata and atomic ID counter (startAt: 10000),
# removes legacy .dbf files, and optionally repopulates via readpats.sh.
# ---------------------------------------------------------------------------

set -e

# Determine directory structure
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export REACTROOT="${REACTROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
export CCROOT="${CCROOT:-$REACTROOT}"
export REACT_USER_UID="${REACT_USER_UID:-UOqk0KtFtaXma5TGsi8Seh9RMbx1}"

POPULATE=0
NODE_ARGS=()

for arg in "$@"; do
  case $arg in
    -p|--populate)
      POPULATE=1
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  -p, --populate      Immediately run readpats.sh to populate all reaction patterns after initialization"
      echo "  --uid=<uid>         Specify target Firestore user UID (default: \$REACT_USER_UID or UOqk0KtFtaXma5TGsi8Seh9RMbx1)"
      echo "  --start-at=<id>     Starting ID for atomic sequence counter (default: 10000)"
      echo "  --dry-run           Print items to be deleted without modifying Firestore"
      echo "  -h, --help          Show this help message"
      exit 0
      ;;
    *)
      NODE_ARGS+=("$arg")
      ;;
  esac
done

echo "================================================================="
echo " REACTCLOUD Reaction Patterns Initializer"
echo "================================================================="
echo " REACTROOT      : $REACTROOT"
echo " User UID       : $REACT_USER_UID"
echo " Auto-Populate  : $([ $POPULATE -eq 1 ] && echo 'YES (readpats.sh will run)' || echo 'NO (clean initialization only)')"
echo "================================================================="

# 1. Remove legacy local GDBM files
echo "[1/3] Removing legacy local database files..."
rm -f "$REACTROOT/data/DB/ReactionPatterns.dbf"
rm -f "$REACTROOT/data/ReactionPatterns.dbf"
echo "      Done."

# 2. Run Firestore initialization script
echo "[2/3] Initializing Firestore database and classifications..."
node "$SCRIPT_DIR/init_reaction_patterns.js" "${NODE_ARGS[@]}"

# 3. Optionally populate database with pattern files
if [ $POPULATE -eq 1 ]; then
  echo ""
  echo "[3/3] Running reaction patterns population (readpats.sh)..."
  echo "-----------------------------------------------------------------"
  csh -f "$SCRIPT_DIR/readpats.sh"
  echo "-----------------------------------------------------------------"
  echo " Reaction patterns population finished successfully!"
else
  echo ""
  echo "[3/3] Skipped auto-populate. To populate reaction patterns later, run:"
  echo "      csh -f $SCRIPT_DIR/readpats.sh"
  echo "   or run this script with --populate:"
  echo "      $0 --populate"
fi

echo ""
echo "All steps completed successfully."
