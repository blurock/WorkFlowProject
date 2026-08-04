#!/bin/csh
# ---------------------------------------------------------------------------

echo $1
sed 's/methylperoxy/methylperoxy-radical/g' $1 >! temp.lsr
mv temp.lsr $1
