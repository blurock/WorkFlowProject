import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KetcherViewerComponent } from './ketcher-viewer.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ChemStructureParserService } from '../../services/chem-structure-parser.service';

describe('KetcherViewerComponent', () => {
  let component: KetcherViewerComponent;
  let fixture: ComponentFixture<KetcherViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KetcherViewerComponent, MatSnackBarModule],
      providers: [ChemStructureParserService]
    }).compileComponents();

    fixture = TestBed.createComponent(KetcherViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format multi-molecule $RXN so that each $MOL block delimiter is on its own line', () => {
    const rawRxn = `$RXN
$MDL
Test-Reaction
  REACTCLOUD
  2  2
$MOL
10405102
  -CPSS-  Generated
primary-carbon-hydrogen-bond
  1  0  0  0  0  0  0  0  0  0999 V2000
    0.1609    0.4377    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
M  END
$MOL
20102000
  -CPSS-  Generated
hydroxyl-radical
  1  0  0  0  0  0  0  0  0  0999 V2000
    0.1609    0.4377    0.0000 O   0  4  0  0  0  0  0  0  0  0  0  0  0  0  0  0
M  END
$MOL
20304102
  -CPSS-  Generated
primary-carbon-radical
  1  0  0  0  0  0  0  0  0  0999 V2000
    0.1609    0.4377    0.0000 C   0  4  0  0  0  0  0  0  0  0  0  0  0  0  0  0
M  END
$MOL
10203000
  -CPSS-  Generated
water
  1  0  0  0  0  0  0  0  0  0999 V2000
    0.1609    0.4377    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
M  END`;

    const formatted = (component as any).ensureValidV2000Molfile(rawRxn);
    expect(formatted.startsWith('$RXN')).toBeTrue();

    // Check that $MOL is strictly separated on its own lines and not appended directly to M END
    expect(formatted).not.toContain('M  END$MOL');

    const lines = formatted.split(/\r?\n/);
    const molDelimLines = lines.filter((l: string) => l.trim() === '$MOL');
    expect(molDelimLines.length).toBe(4);

    const mEndLines = lines.filter((l: string) => l.trim() === 'M  END');
    expect(mEndLines.length).toBe(4);
  });
});

