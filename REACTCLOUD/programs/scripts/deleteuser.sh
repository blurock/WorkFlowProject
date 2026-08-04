#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to delete an user in the react system
#
# ---------------------------------------------------------------------------
#set verbose on

if ( $#argv < 1 ) then
   echo "Usage: $0 username"
   echo "        username     :    The name of the user"
   exit(1)
endif

#--------------------------------------------------------------------------
# Execute script
#--------------------------------------------------------------------------
set USERNAME=$1

rm -rf $REACTROOT/users/$USERNAME
