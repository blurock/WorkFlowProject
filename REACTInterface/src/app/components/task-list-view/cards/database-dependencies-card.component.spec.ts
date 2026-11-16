import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { DatabaseDependenciesCardComponent } from './database-dependencies-card.component';
import { ReactCloudApiService, DependencyCheckResponse } from '../../../services/react-cloud-api.service';

describe('DatabaseDependenciesCardComponent', () => {
  let component: DatabaseDependenciesCardComponent;
  let fixture: ComponentFixture<DatabaseDependenciesCardComponent>;
  let apiServiceSpy: jasmine.SpyObj<ReactCloudApiService>;

  const mockResponse: DependencyCheckResponse = {
    success: true,
    hasDependencies: true,
    count: 2,
    targetName: 'OlefinToAldehydeDecompB-(rh)(rr)',
    targetId: 10206,
    dependencies: [
      {
        type: 'MechanismPathway',
        name: 'OlefinDecompAldToRad',
        id: 0,
        role: 'Mechanism Pathway Step'
      },
      {
        type: 'MechanismPathway',
        name: 'OlefinDecompAldToRadSimple',
        id: 0,
        role: 'Mechanism Pathway Step'
      }
    ]
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ReactCloudApiService', ['checkDatabaseDependencies']);
    apiServiceSpy.checkDatabaseDependencies.and.returnValue(of(mockResponse));

    await TestBed.configureTestingModule({
      imports: [
        DatabaseDependenciesCardComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ReactCloudApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DatabaseDependenciesCardComponent);
    component = fixture.componentInstance;
    component.dbName = 'ReactionPatterns';
    component.targetName = 'OlefinToAldehydeDecompB-(rh)(rr)';
    component.targetId = 10206;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch dependencies on init and display them', () => {
    fixture.detectChanges();
    expect(apiServiceSpy.checkDatabaseDependencies).toHaveBeenCalledWith(
      'ReactionPatterns',
      'OlefinToAldehydeDecompB-(rh)(rr)',
      10206
    );
    expect(component.dependencies.length).toBe(2);
    expect(component.dependencies[0].name).toBe('OlefinDecompAldToRad');
    expect(component.loading).toBeFalse();
  });

  it('should handle empty dependencies gracefully', () => {
    apiServiceSpy.checkDatabaseDependencies.and.returnValue(of({
      success: true,
      hasDependencies: false,
      count: 0,
      targetName: 'UnusedPattern',
      targetId: 9999,
      dependencies: []
    }));

    component.targetName = 'UnusedPattern';
    component.targetId = 9999;
    fixture.detectChanges();

    expect(component.dependencies.length).toBe(0);
    expect(component.loading).toBeFalse();
  });

  it('should handle API errors cleanly', () => {
    apiServiceSpy.checkDatabaseDependencies.and.returnValue(
      throwError(() => ({ message: 'Network error connecting to orchestrator' }))
    );

    fixture.detectChanges();

    expect(component.error).toBe('Network error connecting to orchestrator');
    expect(component.dependencies.length).toBe(0);
    expect(component.loading).toBeFalse();
  });

  it('should map dependency types to suitable icons and CSS classes', () => {
    expect(component.getDepIcon('MechanismPathway')).toBe('alt_route');
    expect(component.getDepIcon('Mechanism')).toBe('precision_manufacturing');
    expect(component.getDepIcon('Reaction')).toBe('sync_alt');

    expect(component.getDepClass('MechanismPathway')).toBe('type-pathway');
    expect(component.getDepClass('Mechanism')).toBe('type-mechanism');
    expect(component.getDepClass('Reaction')).toBe('type-reaction');
  });
});

