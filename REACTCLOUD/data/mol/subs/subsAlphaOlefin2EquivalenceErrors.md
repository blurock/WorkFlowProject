*** goal: replace symmetric substructures 

alphaolefin-radical(rh)(r)(hh) replace with alphaolefin-radical(hh)(r)(rh)
alphaolefin-radical(rr)(h)(hh) replace with alphaolefin-radical(hh)(h)(rr)
alphaolefin-radical(rr)(h)(rh) replace with alphaolefin-radical(rh)(h)(rr)
alphaolefin-radical(rr)(r)(hh) replace with alphaolefin-radical(hh)(r)(rr)
alphaolefin-radical(rr)(r)(rh) replace with alphaolefin-radical(rh)(r)(rr) 

replace the first substructure with the second substructure (because of symmetry)
when used in a reaction pattern. In doing this you have to adjust the correspondences.

Only modify sdf (but not all.sdf) file and lst files. Other files you can skip.

At the end, append a list of all the reaction patterns that have been modified to this file.

### Modified Reaction Patterns

#### 1. `AlphaOlefinRadicalDecompHO2.lst`
- `AlphaOlefinRadicalDecompHO2-(rr)(h)(hh)` (ID 43303): `alphaolefin-radical(rr)(h)(hh)` $\rightarrow$ `alphaolefin-radical(hh)(h)(rr)`
- `AlphaOlefinRadicalDecompHO2-(rh)(r)(hh)` (ID 43305): `alphaolefin-radical(rh)(r)(hh)` $\rightarrow$ `alphaolefin-radical(hh)(r)(rh)`
- `AlphaOlefinRadicalDecompHO2-(rr)(r)(hh)` (ID 43306): `alphaolefin-radical(rr)(r)(hh)` $\rightarrow$ `alphaolefin-radical(hh)(r)(rr)`
- `AlphaOlefinRadicalDecompHO2-(rr)(h)(rh)` (ID 43309): `alphaolefin-radical(rr)(h)(rh)` $\rightarrow$ `alphaolefin-radical(rh)(h)(rr)`
- `AlphaOlefinRadicalDecompHO2-(rr)(r)(rh)` (ID 43312): `alphaolefin-radical(rr)(r)(rh)` $\rightarrow$ `alphaolefin-radical(rh)(r)(rr)`

#### 2. `AlphaOlefinRadicalDecompOH.lst`
- `AlphaOlefinRadicalDecompOH-(rr)(h)(hh)` (ID 43203): `alphaolefin-radical(rr)(h)(hh)` $\rightarrow$ `alphaolefin-radical(hh)(h)(rr)`
- `AlphaOlefinRadicalDecompOH-(rh)(r)(hh)` (ID 43205): `alphaolefin-radical(rh)(r)(hh)` $\rightarrow$ `alphaolefin-radical(hh)(r)(rh)`
- `AlphaOlefinRadicalDecompOH-(rr)(r)(hh)` (ID 43206): `alphaolefin-radical(rr)(r)(hh)` $\rightarrow$ `alphaolefin-radical(hh)(r)(rr)`
- `AlphaOlefinRadicalDecompOH-(rr)(h)(rh)` (ID 43209): `alphaolefin-radical(rr)(h)(rh)` $\rightarrow$ `alphaolefin-radical(rh)(h)(rr)`
- `AlphaOlefinRadicalDecompOH-(rr)(r)(rh)` (ID 43212): `alphaolefin-radical(rr)(r)(rh)` $\rightarrow$ `alphaolefin-radical(rh)(r)(rr)`

#### 3. `PeroxyAllylFormation.lst`
- `PeroxyAllylFormation(rr)(h)(hh)` (ID 70903): `alphaolefin-radical(rr)(h)(hh)` $\rightarrow$ `alphaolefin-radical(hh)(h)(rr)`
- `PeroxyAllylFormation(rh)(r)(hh)` (ID 70905): `alphaolefin-radical(rh)(r)(hh)` $\rightarrow$ `alphaolefin-radical(hh)(r)(rh)`
- `PeroxyAllylFormation(rr)(r)(hh)` (ID 70906): `alphaolefin-radical(rr)(r)(hh)` $\rightarrow$ `alphaolefin-radical(hh)(r)(rr)`
- `PeroxyAllylFormation(rr)(h)(rh)` (ID 70909): `alphaolefin-radical(rr)(h)(rh)` $\rightarrow$ `alphaolefin-radical(rh)(h)(rr)`
- `PeroxyAllylFormation(rr)(r)(rh)` (ID 70912): `alphaolefin-radical(rr)(r)(rh)` $\rightarrow$ `alphaolefin-radical(rh)(r)(rr)`

#### 4. `PropenylRadicalIsomerization.lst`
- `PropenylIsomerization-(rh)(r)(hh)` (ID 42704): `alphaolefin-radical(rh)(r)(hh)` $\rightarrow$ `alphaolefin-radical(hh)(r)(rh)`

