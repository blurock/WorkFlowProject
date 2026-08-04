#!/bin/csh
# ---------------------------------------------------------------------------
#
# Script to create a new user in the react system
#
# ---------------------------------------------------------------------------
#set verbose on

if ( $#argv < 1 ) then
   echo "Usage: $0 username [password]"
   echo "        username     :    The name of the user"
   echo "        password     :    The password overrides database"
   exit(1)
endif

#--------------------------------------------------------------------------
# Execute script
#--------------------------------------------------------------------------
set USERNAME=$1

mkdir $REACTROOT/users/$USERNAME
cp -R $REACTROOT/users/.skel/* $REACTROOT/users/$USERNAME

#--------------------------------------------------------------------------
# Modify input scripts
#--------------------------------------------------------------------------
#echo "s/BASEDIR/'$REACTROOT/users/$USERNAME'/g"
sed  "s@BASEDIR@$REACTROOT/users/$USERNAME@g" \
     $REACTROOT/users/.skel/command/chemdb.als >! $REACTROOT/users/$USERNAME/command/chemdb.als



#---- make the execute.sh file ----
#echo "#\!/usr/bin/zsh"                                > $REACTROOT/users/$USERNAME/execute.sh
#echo "REACTROOT=$REACTROOT/users/$USERNAME"          >> $REACTROOT/users/$USERNAME/execute.sh
#echo 'args=($@)'                                     >> $REACTROOT/users/$USERNAME/execute.sh
#echo 'execute_dir=${args[1]}'                        >> $REACTROOT/users/$USERNAME/execute.sh
#echo 'execute_command=${args[2]}'                    >> $REACTROOT/users/$USERNAME/execute.sh
#echo 'execute_parameters=${args[3,-1]}'              >> $REACTROOT/users/$USERNAME/execute.sh
#echo 'mkdir ${execute_dir} >&/dev/null'              >> $REACTROOT/users/$USERNAME/execute.sh
#echo 'pushd ${execute_dir} >&/dev/null'              >> $REACTROOT/users/$USERNAME/execute.sh
#echo '${execute_command} ${execute_parameters}'      >> $REACTROOT/users/$USERNAME/execute.sh
#echo 'popd >&/dev/null'                              >> $REACTROOT/users/$USERNAME/execute.sh
#chmod +x $REACTROOT/users/$USERNAME/execute.sh

#---- make the .password file ----
if ( $#argv > 1 ) then
   echo $2 > $REACTROOT/users/$USERNAME/.password
endif
