import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SimpleChange } from '@angular/core';
import { of } from 'rxjs';

import { MechanismArtifactViewerComponent } from './mechanism-artifact-viewer.component';
import { ReactCloudApiService } from '../../services/react-cloud-api.service';

describe('MechanismArtifactViewerComponent', () => {
  let component: MechanismArtifactViewerComponent;
  let fixture: ComponentFixture<MechanismArtifactViewerComponent>;
  let apiService: ReactCloudApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MechanismArtifactViewerComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatSnackBarModule
      ],
      providers: [
        ReactCloudApiService
      ]
    }).compileComponents();

    apiService = TestBed.inject(ReactCloudApiService);
    fixture = TestBed.createComponent(MechanismArtifactViewerComponent);
    component = fixture.componentInstance;
    component.mechName = 'test-mech';
    component.files = [
      {
        filename: 'test-mech.mech',
        label: 'Mechanism Reactions (.mech)',
        fileType: 'mech',
        sizeBytes: 1024,
        downloadUrl: 'http://test.url/test-mech.mech'
      },
      {
        filename: 'execution.log',
        label: 'Execution Console Log',
        fileType: 'log',
        sizeBytes: 2048,
        downloadUrl: 'http://test.url/execution.log'
      }
    ];
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should extract missing reaction pattern from error line in log', () => {
    const log = `
Step 1 complete.
ERROR: Reaction Pattern Not Found: 'OlefinToAldehydeDecomp-(hh)(rh)'
ERROR: Reaction Pattern Not Found: 'AldehydeHAbstractionCH3-(hh)'
Execution terminated.
    `;
    const missing = apiService.extractMissingReactionPatterns(log);
    expect(missing.length).toBe(2);
    expect(missing[0]).toBe('OlefinToAldehydeDecomp-(hh)(rh)');
    expect(missing[1]).toBe('AldehydeHAbstractionCH3-(hh)');
  });

  it('should detect missing reaction patterns from explicit input', () => {
    component.missingReactionPatterns = ['OlefinToAldehydeDecomp-(hh)(rh)'];
    component.ngOnChanges({
      missingReactionPatterns: new SimpleChange(null, component.missingReactionPatterns, true)
    });
    fixture.detectChanges();

    expect(component.detectedMissingPatterns.length).toBe(1);
    expect(component.detectedMissingPatterns[0]).toBe('OlefinToAldehydeDecomp-(hh)(rh)');
    expect(component.isMissingPanelDismissed).toBeFalse();

    const banner = fixture.nativeElement.querySelector('.missing-patterns-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('OlefinToAldehydeDecomp-(hh)(rh)');
  });

  it('should detect missing reaction patterns from executionLog input', () => {
    component.executionLog = "Running step 3...\nERROR: Reaction Pattern Not Found: 'TestPattern-(rr)(hh)'\nDone.";
    component.ngOnChanges({
      executionLog: new SimpleChange(null, component.executionLog, true)
    });
    fixture.detectChanges();

    expect(component.detectedMissingPatterns.length).toBe(1);
    expect(component.detectedMissingPatterns[0]).toBe('TestPattern-(rr)(hh)');
  });

  it('should dismiss and re-open the missing patterns banner', () => {
    component.missingReactionPatterns = ['MissingPattern1'];
    component.ngOnChanges({
      missingReactionPatterns: new SimpleChange(null, component.missingReactionPatterns, true)
    });
    fixture.detectChanges();

    expect(component.isMissingPanelDismissed).toBeFalse();
    component.isMissingPanelDismissed = true;
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.missing-patterns-banner');
    expect(banner).toBeFalsy();

    // Re-open
    component.isMissingPanelDismissed = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.missing-patterns-banner')).toBeTruthy();
  });

  it('should switch to execution.log tab when selectLogFile is invoked', () => {
    spyOn(component, 'onTabChanged').and.callThrough();
    expect(component.hasLogFile()).toBeTrue();

    component.selectLogFile();
    expect(component.onTabChanged).toHaveBeenCalledWith(1); // execution.log is index 1
    expect(component.selectedFileIndex).toBe(1);
  });
});

