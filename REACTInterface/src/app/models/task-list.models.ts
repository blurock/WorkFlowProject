export interface AtomElectronicRow {
  atomIndex: number;
  atomicNumber: number;
  charge: string;
  nElectrons: string;
  nOccupied: number;
  shells: string[];
}

export interface AtomChargeRow {
  atomIndex: number;
  radius: string;
  electronegativity: string;
  screening: string;
  effectiveCharge: string;
  residualCharge: string;
  beta: string;
}

export interface AltNameRow {
  name: string;
  type: string;
}

export interface MatchedAtomRow {
  reactantMolecule: number;
  reactantIndex: number;
  productMolecule: number;
  productIndex: number;
}

export interface BondChangeRow {
  reactantAtom1: string;
  reactantAtom2: string;
  productAtom1: string;
  productAtom2: string;
}

export interface ReactionRateRow {
  direction: string;
  aConstant: string;
  nExponent: string;
  energy: string;
  type: string;
  reference: string;
}

export interface BensonGroupRow {
  name: string;
  heatOfFormation: string;
  entropy: string;
  cp300: string;
  cp400: string;
  cp500: string;
  cp600: string;
  cp800: string;
  cp1000: string;
  cp1500: string;
}

export interface BensonGroupTableData {
  tableName: string;
  reference: string;
  pattern: string;
  rows: BensonGroupRow[];
}

export interface MoleculeSection {
  id: number;
  title: string;
  icon: string;
  content: string;
  isExpanded: boolean;
  electronicTableData?: AtomElectronicRow[];
  chargeTableData?: AtomChargeRow[];
  altNamesData?: AltNameRow[];
  matchedAtomsData?: MatchedAtomRow[];
  bondChangesData?: BondChangeRow[];
  reactionRateData?: ReactionRateRow[];
  bensonGroupTableData?: BensonGroupTableData;
}
