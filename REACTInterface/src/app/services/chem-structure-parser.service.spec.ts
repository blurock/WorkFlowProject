import { TestBed } from '@angular/core/testing';
import { ChemStructureParserService } from './chem-structure-parser.service';

describe('ChemStructureParserService', () => {
  let service: ChemStructureParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChemStructureParserService]
    });
    service = TestBed.inject(ChemStructureParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should convert Ketcher M RAD molfile to system SDF format with code 4 in column 39', () => {
    const ketcherMol = `
  Ketcher 10312616572D 1   1.00000     0.00000     0

  2  1  0  0  0  0  0  0  0  0999 V2000
    2.2920   -5.1500    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    3.1580   -4.6500    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0     0  0
M  RAD  1   1   2
M  END
`;

    const converted = service.convertKetcherRadicalsToSystemFormat(ketcherMol);

    // Atom 1 line should have charge code 4 in column 37-39 (indices 36..39)
    const lines = converted.trim().split(/\r?\n/);
    const atom1Line = lines.find(l => l.includes('O') && l.includes('2.2920'));
    expect(atom1Line).toBeDefined();
    expect(atom1Line!.substring(36, 39)).toBe('  4');

    // Atom 2 line should remain unchanged with '  0'
    const atom2Line = lines.find(l => l.includes('O') && l.includes('3.1580'));
    expect(atom2Line).toBeDefined();
    expect(atom2Line!.substring(36, 39)).toBe('  0');

    // M  RAD line should be removed
    expect(converted.includes('M  RAD')).toBeFalse();
    expect(converted.includes('M  END')).toBeTrue();
  });

  it('should translate Ketcher drawing with M RAD to complete SDF with code 4', () => {
    const ketcherMol = `
  Ketcher

  2  1  0  0  0  0  0  0  0  0999 V2000
    2.2920   -5.1500    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    3.1580   -4.6500    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0     0  0
M  RAD  1   1   2
M  END
`;

    const sdf = service.translateKetcherToSdf(ketcherMol, '1-peroxy-2-methylpropane', 'Molecule');

    expect(sdf).toContain('1-peroxy-2-methylpropane');
    expect(sdf).toContain('$$$$');
    expect(sdf.includes('M  RAD')).toBeFalse();

    const lines = sdf.split(/\r?\n/);
    const atom1Line = lines.find(l => l.includes('O') && l.includes('2.2920'));
    expect(atom1Line).toBeDefined();
    expect(atom1Line!.substring(36, 39)).toBe('  4');
  });

  it('should leave non-radical molecules unchanged', () => {
    const normalMol = `
  Ketcher

  2  1  0  0  0  0  0  0  0  0999 V2000
    2.2920   -5.1500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.1580   -4.6500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0     0  0
M  END
`;
    const converted = service.convertKetcherRadicalsToSystemFormat(normalMol);
    expect(converted).toBe(normalMol);
  });

  it('should parse atom radical field directly in parsePrettyMolfileMap without valence heuristics', () => {
    const chemdbRawOutput = `
Reactant Molfile: :MolFile 20001000 :  1 Atoms :  0 Bonds : hydrogen-radical
~
                  :Atom     0:     0.161:     0.438:     0.000: 1   :0.0     : 1       :         6
~
~
`;
    const map = service.parsePrettyMolfileMap(chemdbRawOutput);
    expect(map.has('20001000')).toBeTrue();
    const item = map.get('20001000')!;
    expect(item.molName).toBe('hydrogen-radical');
    expect(item.molBlock).toContain('M  RAD  1   1   2');
    expect(item.molBlock).toContain('M  END');

    // Column 37-39 of atom line should contain code 4
    const lines = item.molBlock.split(/\r?\n/);
    const hLine = lines.find(l => l.includes('H'));
    expect(hLine).toBeDefined();
    expect(hLine!.substring(36, 39)).toBe('  4');
  });

  it('should build a valid MDL RXN string with properly delimited MOL blocks and counts line', () => {
    const mol1 = `10405102
  -CPSS-  Generated
primary-carbon-hydrogen-bond
  1  0  0  0  0  0  0  0  0  0999 V2000
    0.1609    0.4377    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
M  END
$$$$`;
    const mol2 = `10203000
  -CPSS-  Generated
water
  1  0  0  0  0  0  0  0  0  0999 V2000
    0.1609    0.4377    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
M  END
$$$$`;

    const rxn = service.buildRxnFileFromSdfBlocks([mol1], [mol2], 'Test-Reaction');
    expect(rxn.startsWith('$RXN')).toBeTrue();
    expect(rxn).toContain('$MOL');
    expect(rxn).toContain('  1  1');
    expect(rxn).toContain('Test-Reaction');
  });
});
