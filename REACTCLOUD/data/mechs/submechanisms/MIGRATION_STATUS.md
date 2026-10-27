# REACTCLOUD Mechanism Pathway Migration Status Report

**Generated**: 2026-10-27T20:38:52.066Z
**Total Pathway Files Evaluated**: 92
**Valid Pathways (Ready for Firestore)**: 86 (93%)
**Malformed Files (Requiring Format Fix)**: 6

> [!NOTE]
> Mechanism pathways loaded into Firestore under `users/{uid}/databases/MechanismPathway/records/{Name}`.
> Malformed files require missing continuation backslashes (`\`) or reaction step definitions to be corrected before upload.

## ⚠️ Malformed Files (6 Files)

These files failed validation and were **not** seeded to Firestore. You can fix the syntax and seed individually using:
```bash
node scripts/manage_mechanism_pathways.js --file <filename>.lsr
```

| File Name | Detected Title | Error Description |
| :--- | :--- | :--- |
| `EthylRadicalToOlefin.lsr` | EthylRadicalToOlefin | Format error on line 18: Line begins with colon (:) without preceding reaction patterns (missing continuation character '\' on preceding line?) |
| `KetoneToCO.lsr` | Olefin Decomposition through OH addition | Format error on line 40: Line begins with colon (:) without preceding reaction patterns (missing continuation character '\' on preceding line?) |
| `OlefinDecompThroughKetoneAlphaRadical.lsr` | OlefinDecomp | Format error on line 61: Line begins with colon (:) without preceding reaction patterns (missing continuation character '\' on preceding line?) |
| `OlefinDecompThroughLowTempV1.lsr` | OlefinDecompThroughLowTemp | Format error on line 148: Line begins with colon (:) without preceding reaction patterns (missing continuation character '\' on preceding line?) |
| `OlefinHAbstraction.lsr` | Olefin Decomposition through aldehyde and then to radical | Format error on line 69: Line begins with colon (:) without preceding reaction patterns (missing continuation character '\' on preceding line?) |
| `TypeVI.lsr` | OlefinDecomp | Format error on line 73: Line begins with colon (:) without preceding reaction patterns (missing continuation character '\' on preceding line?) |

---

## ✅ Successfully Parsed Pathways (86 Files)

| # | Pathway Key (Name) | Steps | Aux Molecules | Patterns | Molecules | File Name |
| :---: | :--- | :---: | :--- | :---: | :---: | :--- |
| 1 | **AdditionToOlefinFromAlkane** | 4 | hydrogen-radical, oxygen, hydroxyl-radical | 47 | 3 | `AdditionToOlefinFromAlkane.lsr` |
| 2 | **AldehydeDecomposition** | 9 | hydroxyl-radical | 207 | 8 | `AldehydeDecomposition.lsr` |
| 3 | **AldehydeDecompositionV3** | 5 | hydroxyl-radical, oxygen, hydrogen-radical, methyl-radical, oxygen-radicalmethoxy-radical, methylperoxy-radical, peroxyl-radical | 180 | 7 | `AldehydeDecompositionV3.lsr` |
| 4 | **AldehydeDecompositionV4** | 8 | hydroxyl-radical, oxygen, hydrogen-radical, methyl-radical, oxygen-radical, methoxy-radical, methylperoxy-radical, peroxyl-radical | 186 | 8 | `AldehydeDecompositionV4.lsr` |
| 5 | **AldehydeDecompositionV5** | 8 | hydroxyl-radical, oxygen, hydrogen-radical, methyl-radical, oxygen-radical, methoxy-radical, methylperoxy-radical, peroxyl-radical | 156 | 8 | `AldehydeDecompositionV5.lsr` |
| 6 | **AldehydeDecomposition_Step1** | 1 | hydrogen-radical | 3 | 1 | `AldehydeDecomposition_Step1.lsr` |
| 7 | **AldehydeDecomposition_Step2** | 1 | hydrogen-radical | 9 | 1 | `AldehydeDecomposition_Step2.lsr` |
| 8 | **AlkeneFromRadical** | 2 | oxygen | 39 | 1 | `AlkeneFromRadical.lsr` |
| 9 | **AlkeneLowTempDecomp** | 6 | oxygen, hydrogen-radical, oxygen-radical, hydroxyl-radical, methyl-radical, peroxyl-radical | 37 | 6 | `AlkeneLowTempDecomp.lsr` |
| 10 | **AlkeneToC6H6** | 8 | oxygen, hydrogen-radical, methyl-radical | 45 | 3 | `AlkeneToC6H6.lsr` |
| 11 | **AlkoxyDecomp** | 5 | hydrogen-peroxide | 15 | 2 | `AlkoxyDecomp.lsr` |
| 12 | **AlkoxyFromPeroxy** | 4 | hydrogen-peroxide | 14 | 2 | `AlkoxyFromPeroxy.lsr` |
| 13 | **AlphaHHydroPeroxylIsomerization** | 4 | *None* | 13 | 1 | `AlphaHHydroPeroxylIsomerization.lsr` |
| 14 | **AlphaOlefinDecomp** | 4 | oxygen | 66 | 6 | `AlphaOlefinDecomp.lsr` |
| 15 | **BasicLowTempSideRxnsOlefinFromQOOH** | 4 | oxygen, peroxyl-radical | 20 | 2 | `BasicLowTempSideRxnsOlefinFromQOOH.lsr` |
| 16 | **BasicLowTemperature** | 8 | oxygen | 134 | 1 | `BasicLowTemperature.lsr` |
| 17 | **BasicLowTemperatureSideRxnsQOOH** | 4 | oxygen | 30 | 1 | `BasicLowTemperatureSideRxnsQOOH.lsr` |
| 18 | **BasicLowTemperatureSideRxnsQOOHV2.0** | 4 | oxygen, peroxyl-radical | 24 | 2 | `BasicLowTemperatureSideRxnsQOOHV2.0.lsr` |
| 19 | **BasicLowTemperatureSideRxnsQOOHV3.0** | 4 | oxygen, hydrogen-radical | 30 | 2 | `BasicLowTemperatureSideRxnsQOOHV3.0.lsr` |
| 20 | **BasicLowTemperatureSideRxnsRO2** | 5 | oxygen, peroxyl-radical, hydrogen-peroxide, methylperoxy-radical | 39 | 4 | `BasicLowTemperatureSideRxnsRO2.lsr` |
| 21 | **BasicLowTemperatureSideRxnsRO2V3.0** | 5 | oxygen, peroxyl-radical, hydrogen-peroxide, methylperoxy-radical | 20 | 4 | `BasicLowTemperatureSideRxnsRO2V3.0.lsr` |
| 22 | **BasicLowTemperatureSideRxnsRO2V4** | 5 | oxygen, peroxyl-radical, hydrogen-peroxide, methylperoxy | 29 | 4 | `BasicLowTemperatureSideRxnsRO2V4.lsr` |
| 23 | **BasicLowTemperatureV2.0** | 9 | oxygen, hydroxyl-radical, hydrogen-radical, oxygen-radical | 105 | 4 | `BasicLowTemperatureV2.0.lsr` |
| 24 | **BasicLowTemperatureV2.1** | 8 | oxygen, hydroxyl-radical, hydrogen-radical, oxygen-radical | 93 | 4 | `BasicLowTemperatureV2.1.lsr` |
| 25 | **BasicLowTemperatureV2.2** | 9 | oxygen, hydrogen-radical | 97 | 2 | `BasicLowTemperatureV2.2.lsr` |
| 26 | **BasicLowTemperatureV2.3** | 8 | oxygen, hydrogen-radical | 88 | 2 | `BasicLowTemperatureV2.3.lsr` |
| 27 | **BasicLowTemperatureV2.4** | 6 | oxygen, hydrogen-radical | 45 | 2 | `BasicLowTemperatureV2.4.lsr` |
| 28 | **BasicLowTemperatureV2.5** | 7 | oxygen, hydrogen-radical | 67 | 2 | `BasicLowTemperatureV2.5.lsr` |
| 29 | **BasicLowTemperatureV3** | 8 | oxygen, hydrogen-radical | 135 | 2 | `BasicLowTemperatureV3.lsr` |
| 30 | **BetaHHydroPeroxylIsomerization** | 4 | *None* | 11 | 1 | `BetaHHydroPeroxylIsomerization.lsr` |
| 31 | **BetaHPeroxyToOlefin** | 4 | oxygen | 24 | 1 | `BetaHPeroxyToOlefin.lsr` |
| 32 | **BetaOlefinDecompRadical** | 4 | oxygen | 21 | 1 | `BetaOlefinDecompRadical.lsr` |
| 33 | **CyclicEtherFromQOOH** | 6 | oxygen, hydroxyl-radical | 48 | 3 | `CyclicEtherFromQOOH.lsr` |
| 34 | **CyclicEtherFromQOOHV2.0** | 5 | oxygen | 42 | 2 | `CyclicEtherFromQOOHV2.0.lsr` |
| 35 | **CyclicEtherFromQOOHV3.0** | 6 | oxygen, hydroxyl-radical | 48 | 2 | `CyclicEtherFromQOOHV3.0.lsr` |
| 36 | **CyclicEtherFromQOOHV4** | 6 | oxygen, hydroxyl-radical | 59 | 3 | `CyclicEtherFromQOOHV4.lsr` |
| 37 | **CyclohexaneCyclicEtherFromQOOH** | 8 | oxygen, hydroxyl-radical | 61 | 8 | `CyclohexaneCyclicEtherFromQOOH.lsr` |
| 38 | **CyclohexaneLowTemperature** | 9 | oxygen, hydroxyl-radical, oxygen-radical | 197 | 3 | `CyclohexaneLowTemperature.lsr` |
| 39 | **Decomposition** | 1 | *None* | 12 | 0 | `Decomposition.lsr` |
| 40 | **DieneFormationFromAlkene** | 5 | oxygen, hydrogen-radical, oxygen-radical, hydroxyl-radical, methyl-radical, peroxyl-radical | 45 | 6 | `DieneFormationFromAlkene.lsr` |
| 41 | **HAbstractionBySimpleRadical** | 1 | hydrogen-radical, oxygen-radical, oxygen, methyl-radical, peroxyl-radical, methoxy-radical, ethyl-radical, ethenyl-radical, methylperoxy-radical | 30 | 9 | `HAbstractionBySimpleRadical.lsr` |
| 42 | **HAbstractionBySimpleRadical1** | 1 | hydroxyl-radical, oxygen-radical, oxygen, hydrogen-radical, peroxyl-radical | 15 | 5 | `HAbstractionBySimpleRadical1.lsr` |
| 43 | **HAbstractionBySimpleRadical2** | 1 | ethyl-radical, ethenyl-radical, methyl-radical, methoxy-radical, methylperoxy-radical | 15 | 5 | `HAbstractionBySimpleRadical2.lsr` |
| 44 | **HShift** | 2 | oxygen, hydroxyl-radical | 8 | 2 | `HShift.lsr` |
| 45 | **HighTemperatureRadical** | 2 | hydrogen-radical, oxygen-radical, oxygen, methyl-radical, peroxyl-radical, methoxy-radical, ethyl-radical, methylperoxy-radical, ethenyl-radical | 122 | 9 | `HighTemperatureRadical.lsr` |
| 46 | **Isomerizations** | 2 | oxygen, hydroxyl-radical | 7 | 2 | `Isomerizations.lsr` |
| 47 | **KetoneToKetene** | 6 | hydroxyl-radical, oxygen, hydrogen-radical, methyl-radical, oxygen-radical | 60 | 5 | `KetoneToKetene.lsr` |
| 48 | **KetoneToOlefin** | 5 | hydroxyl-radical, oxygen, hydrogen-radical, methyl-radical | 90 | 4 | `KetoneToOlefin.lsr` |
| 49 | **OlefinCarbonylFromPeroxy** | 4 | *None* | 21 | 1 | `OlefinCarbonylFromPeroxy.lsr` |
| 50 | **OlefinDecomp** | 7 | hydroxyl-radical, oxygen, hydrogen-radical, methyl-radical | 91 | 4 | `OlefinDecomp.lsr` |
| 51 | **OlefinDecompAldToRad** | 5 | oxygen, hydroxyl-radical, hydrogen-radical, oxygen-radical, peroxyl-radical, methyl-radical, methoxy-radical, methylperoxy-radical | 45 | 8 | `OlefinDecompAldToRad.lsr` |
| 52 | **OlefinDecompAldToRadSimple** | 3 | oxygen | 69 | 3 | `OlefinDecompAldToRadSimple.lsr` |
| 53 | **OlefinDecompMultiple** | 7 | oxygen | 39 | 1 | `OlefinDecompMultiple.lsr` |
| 54 | **OlefinDecompThroughAldehydeAlphaRadical** | 5 | hydroxyl-radical, oxygen, hydrogen-radical, methyl-radical | 48 | 4 | `OlefinDecompThroughAldehydeAlphaRadical.lsr` |
| 55 | **OlefinDecompThroughAldehydeBetaRadical** | 6 | hydroxyl-radical, oxygen, hydrogen-radical, methyl-radical | 117 | 5 | `OlefinDecompThroughAldehydeBetaRadical.lsr` |
| 56 | **OlefinDecompThroughAldehydeGammaRadical** | 6 | hydroxyl-radical, oxygen, hydrogen-radical, methyl-radical | 135 | 5 | `OlefinDecompThroughAldehydeGammaRadical.lsr` |
| 57 | **OlefinDecompThroughAldehydeOuterRadical** | 6 | hydroxyl-radical, oxygen, hydrogen-radical, methyl-radical | 108 | 5 | `OlefinDecompThroughAldehydeOuterRadical.lsr` |
| 58 | **OlefinDecompThroughAlkylPeroxy** | 8 | oxygen, hydrogen-radical, oxygen-radical, hydroxyl-radical, methyl-radical, peroxyl-radical | 55 | 8 | `OlefinDecompThroughAlkylPeroxy.lsr` |
| 59 | **OlefinDecompThroughAlkylQOOH** | 8 | oxygen, hydrogen-radical, oxygen-radical, hydroxyl-radical, methyl-radical, peroxyl-radical | 87 | 6 | `OlefinDecompThroughAlkylQOOH.lsr` |
| 60 | **OlefinDecompThroughAlkynyl** | 7 | hydrogen-radical, methyl-radical, oxygen-radical, hydroxyl-radical | 57 | 6 | `OlefinDecompThroughAlkynyl.lsr` |
| 61 | **OlefinDecompThroughAlphaRadical** | 5 | oxygen, hydrogen-radical | 51 | 2 | `OlefinDecompThroughAlphaRadical.lsr` |
| 62 | **OlefinDecompThroughAlphaRadicalV1** | 7 | oxygen, hydrogen-radical | 72 | 2 | `OlefinDecompThroughAlphaRadicalV1.lsr` |
| 63 | **OlefinDecompThroughAlphaRadicalV2** | 5 | oxygen, hydrogen-radical | 51 | 2 | `OlefinDecompThroughAlphaRadicalV2.lsr` |
| 64 | **OlefinDecompThroughLowTemp** | 10 | oxygen, hydrogen-radical, oxygen-radical, hydroxyl-radical, methyl-radical, peroxyl-radical | 159 | 6 | `OlefinDecompThroughLowTemp.lsr` |
| 65 | **OlefinDecompThroughLowTempSimpleI** | 8 | oxygen, hydrogen-radical, oxygen-radical, hydroxyl-radical, methyl-radical, peroxyl-radical | 57 | 6 | `OlefinDecompThroughLowTempSimpleI.lsr` |
| 66 | **OlefinDecompThroughLowTempV2** | 10 | oxygen, hydrogen-radical, oxygen-radical, hydroxyl-radical, methyl-radical, peroxyl-radical | 145 | 6 | `OlefinDecompThroughLowTempV2.lsr` |
| 67 | **OlefinDecompToAlkenyl** | 3 | oxygen | 47 | 5 | `OlefinDecompToAlkenyl.lsr` |
| 68 | **OlefinDecompToOlefin** | 9 | oxygen | 108 | 2 | `OlefinDecompToOlefin.lsr` |
| 69 | **OlefinDecompToRadical** | 6 | oxygen | 141 | 6 | `OlefinDecompToRadical.lsr` |
| 70 | **OlefinDecompToRadicalV1** | 3 | oxygen | 47 | 1 | `OlefinDecompToRadicalV1.lsr` |
| 71 | **OlefinDecompToRadicalV2** | 5 | oxygen | 141 | 6 | `OlefinDecompToRadicalV2.lsr` |
| 72 | **OlefinDecompToRadicalV3** | 6 | oxygen | 141 | 6 | `OlefinDecompToRadicalV3.lsr` |
| 73 | **OlefinDecompToSmallerRadical** | 3 | hydroxyl-radical, oxygen, hydrogen-radical, methyl-radical | 20 | 4 | `OlefinDecompToSmallerRadical.lsr` |
| 74 | **OlefinFromRadical** | 2 | oxygen | 48 | 1 | `OlefinFromRadical.lsr` |
| 75 | **OlefinKetoneBetaAbsToRadical** | 6 | oxygen | 90 | 2 | `OlefinKetoneBetaAbsToRadical.lsr` |
| 76 | **OlefinKetoneOlefinDecomp** | 5 | oxygen | 51 | 2 | `OlefinKetoneOlefinDecomp.lsr` |
| 77 | **OlefinKetoneSecondHAbstraction** | 4 | *None* | 45 | 10 | `OlefinKetoneSecondHAbstraction.lsr` |
| 78 | **PaperBasicLowTemperature** | 9 | oxygen, hydroxyl-radical, hydrogen-radical | 71 | 3 | `PaperBasicLowTemperature.lsr` |
| 79 | **PeroxyFromHydrogenPeroxide** | 3 | hydrogen-peroxide | 10 | 2 | `PeroxyFromHydrogenPeroxide.lsr` |
| 80 | **PropenylIsomerization** | 4 | oxygen | 54 | 1 | `PropenylIsomerization.lsr` |
| 81 | **ROOHFromPeroxylRadical** | 3 | *None* | 10 | 2 | `ROOHFromPeroxylRadical.lsr` |
| 82 | **ReactionPatternTest** | 1 | *None* | 9 | 0 | `ReactionPatternTest.lsr` |
| 83 | **Test** | 5 | oxygen, hydroxyl-radical, oxygen-radical | 5 | 3 | `Test.lsr` |
| 84 | **TypeVII** | 3 | hydroxyl-radical, oxygen, oxygen-radical, hydrogen-radical | 54 | 4 | `TypeVII.lsr` |
| 85 | **WaddingtonDecomposition** | 5 | oxygen | 39 | 2 | `WaddingtonDecomposition.lsr` |
| 86 | **rest** | 2 | HAbstractionBetaAlkenylToDieneCH3-(h)(hh), HAbstractionBetaAlkenylToDieneCH3-(r)(hh), HAbstractionBetaAlkenylToDieneCH3-(h)(rh), HAbstractionBetaAlkenylToDieneCH3-(r)(rh), HAbstractionBetaAlkenylToDieneCH3-(h)(rr), HAbstractionBetaAlkenylToDieneCH3-(r)(rr), HAbstractionBetaAlkenylToDieneH-(h)(hh), HAbstractionBetaAlkenylToDieneH-(r)(hh), HAbstractionBetaAlkenylToDieneH-(h)(rh), HAbstractionBetaAlkenylToDieneH-(r)(rh), HAbstractionBetaAlkenylToDieneH-(h)(rr), HAbstractionBetaAlkenylToDieneH-(r)(rr), HAbstractionBetaAlkenylToDieneO2-(h)(hh), HAbstractionBetaAlkenylToDieneO2-(r)(hh), HAbstractionBetaAlkenylToDieneO2-(h)(rh), HAbstractionBetaAlkenylToDieneO2-(r)(rh), HAbstractionBetaAlkenylToDieneO2-(h)(rr), HAbstractionBetaAlkenylToDieneO2-(r)(hh), HLossBetaAlkenylToDiene-(h)(hh), HLossBetaAlkenylToDiene-(r)(hh), HLossBetaAlkenylToDiene-(h)(rh), HLossBetaAlkenylToDiene-(r)(rh), HLossBetaAlkenylToDiene-(h)(rr), HLossBetaAlkenylToDiene-(r)(rr):oxygen, hydrogen-radical, methyl-radical | 29 | 26 | `rest.lsr` |

