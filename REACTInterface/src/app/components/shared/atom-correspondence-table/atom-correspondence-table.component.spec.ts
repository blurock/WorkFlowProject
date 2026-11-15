import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AtomCorrespondenceTableComponent } from './atom-correspondence-table.component';
import { AtomCorrespondenceRow, BondChangeRow } from '../../../services/atom-correspondence.service';

describe('AtomCorrespondenceTableComponent', () => {
  let component: AtomCorrespondenceTableComponent;
  let fixture: ComponentFixture<AtomCorrespondenceTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtomCorrespondenceTableComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AtomCorrespondenceTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render correspondence rows and compute unmatchedAtomsCount', () => {
    const rows: AtomCorrespondenceRow[] = [
      {
        reactantAtomNumber: 1,
        reactantSymbol: 'C',
        reactantMoleculeIndex: 1,
        productAtomNumber: 1,
        candidateProductAtoms: [
          { atomNumber: 1, label: 'Atom #1 (C)', symbol: 'C', moleculeIndex: 1 }
        ]
      },
      {
        reactantAtomNumber: 2,
        reactantSymbol: 'H',
        reactantMoleculeIndex: 1,
        productAtomNumber: null,
        candidateProductAtoms: [
          { atomNumber: 2, label: 'Atom #2 (H)', symbol: 'H', moleculeIndex: 1 }
        ]
      }
    ];

    component.correspondenceRows = rows;
    fixture.detectChanges();

    expect(component.unmatchedAtomsCount).toBe(1);
  });

  it('should emit correspondenceChange event when selection changes', () => {
    spyOn(component.correspondenceChange, 'emit');
    component.correspondenceRows = [
      { reactantAtomNumber: 1, reactantSymbol: 'C', productAtomNumber: 1, candidateProductAtoms: [] }
    ];

    component.onCorrespondenceSelectChange();
    expect(component.correspondenceChange.emit).toHaveBeenCalledWith(component.correspondenceRows);
  });

  it('should emit storeChange event when store button is clicked', () => {
    spyOn(component.storeChange, 'emit');
    component.correspondenceRows = [
      { reactantAtomNumber: 1, reactantSymbol: 'C', productAtomNumber: 1, candidateProductAtoms: [] }
    ];
    component.bondChangeRows = [
      { moleculeIndex: 1, atom1Number: 1, atom2Number: 2, type: 4 }
    ];

    component.onStore();
    expect(component.storeChange.emit).toHaveBeenCalledWith({
      correspondences: component.correspondenceRows,
      bondChanges: component.bondChangeRows
    });
  });
});

