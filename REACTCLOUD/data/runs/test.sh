#! /bin/tcsh -f

pushd /usr/local/Software/react/molprops
make library
popd

pushd /usr/local/Software/react/chemdb
rm chemdb
make chemdb
popd

runchain.sh AlkeneFromRadical 'propane,oxygen' test > ! tst.out 
