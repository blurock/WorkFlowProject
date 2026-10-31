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
});
