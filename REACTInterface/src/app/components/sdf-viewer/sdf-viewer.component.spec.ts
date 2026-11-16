import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdfViewerComponent } from './sdf-viewer.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('SdfViewerComponent', () => {
  let component: SdfViewerComponent;
  let fixture: ComponentFixture<SdfViewerComponent>;

  const sampleChemdbSdf = `11314400
  -CPSS-  Generated
butane
 14 13  0  0  0  0  0  0  0  0999 V2000
   -2.0200    0.8600    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
   -0.2800    0.0800    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0  0  0  0  0
M  END
10102001
  -CPSS-  Generated
oxygen
  2  1  0  0  0  0  0  0  0  0999 V2000
   -3.3200   -0.1800    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
   -1.3300    1.1500    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
  2  1  2  0  0  0  0  0  0  0  0
M  END`;

  const sampleStandardSdf = `benzene
  ChemDraw08051912342D

 12 12  0  0  0  0  0  0  0  0999 V2000
   -1.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0  0  0  0  0
M  END
$$$$
toluene
  ChemDraw08051912342D

 15 15  0  0  0  0  0  0  0  0999 V2000
   -1.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0  0  0  0  0
M  END
$$$$`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdfViewerComponent, MatSnackBarModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SdfViewerComponent);
    component = fixture.componentInstance;
  });

  it('should create the SDF viewer component', () => {
    expect(component).toBeTruthy();
  });

  it('should parse chemdb format with M  END delimiters', () => {
    component.sdfContent = sampleChemdbSdf;
    component.filename = 'butane-test.sdf';
    component.parseSdfContent(sampleChemdbSdf);

    expect(component.parsedMolecules.length).toBe(2);

    const mol1 = component.parsedMolecules[0];
    expect(mol1.moleculeName).toBe('butane');
    expect(mol1.atomCount).toBe(14);
    expect(mol1.bondCount).toBe(13);
    expect(mol1.isExpanded).toBeFalse();
    expect(mol1.sdfContent).toContain('M  END');

    const mol2 = component.parsedMolecules[1];
    expect(mol2.moleculeName).toBe('oxygen');
    expect(mol2.atomCount).toBe(2);
    expect(mol2.bondCount).toBe(1);
    expect(mol2.isExpanded).toBeFalse();
  });

  it('should parse standard $$$$ delimited SDF format', () => {
    component.sdfContent = sampleStandardSdf;
    component.parseSdfContent(sampleStandardSdf);

    expect(component.parsedMolecules.length).toBe(2);
    expect(component.parsedMolecules[0].moleculeName).toBe('benzene');
    expect(component.parsedMolecules[0].atomCount).toBe(12);
    expect(component.parsedMolecules[1].moleculeName).toBe('toluene');
    expect(component.parsedMolecules[1].atomCount).toBe(15);
  });

  it('should toggle molecule expansion state', () => {
    component.parseSdfContent(sampleChemdbSdf);
    const mol = component.parsedMolecules[0];
    expect(mol.isExpanded).toBeFalse();

    component.toggleMolecule(mol);
    expect(mol.isExpanded).toBeTrue();

    component.toggleMolecule(mol);
    expect(mol.isExpanded).toBeFalse();
  });

  it('should toggle all molecules at once', () => {
    component.parseSdfContent(sampleChemdbSdf);
    expect(component.isAllExpanded).toBeFalse();

    component.toggleAll();
    expect(component.isAllExpanded).toBeTrue();
    expect(component.parsedMolecules.every(m => m.isExpanded)).toBeTrue();

    component.toggleAll();
    expect(component.isAllExpanded).toBeFalse();
    expect(component.parsedMolecules.every(m => !m.isExpanded)).toBeTrue();
  });

  it('should toggle raw SDF expanded state', () => {
    expect(component.isRawSdfExpanded).toBeFalse();
    component.toggleRawSdf();
    expect(component.isRawSdfExpanded).toBeTrue();
    component.toggleRawSdf();
    expect(component.isRawSdfExpanded).toBeFalse();
  });

  it('should toggle line wrap', () => {
    expect(component.isLineWrapEnabled).toBeFalse();
    component.toggleLineWrap();
    expect(component.isLineWrapEnabled).toBeTrue();
  });
});

