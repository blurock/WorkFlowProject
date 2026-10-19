import { TestBed } from '@angular/core/testing';
import { TargetMoleculeService } from './target-molecule.service';
import { ChemStructureParserService } from './chem-structure-parser.service';
import { ExistenceCheckService } from './existence-check.service';
import { ReactCloudApiService } from './react-cloud-api.service';
import { of } from 'rxjs';

describe('TargetMoleculeService', () => {
  let service: TargetMoleculeService;
  let existenceCheckServiceMock: jasmine.SpyObj<ExistenceCheckService>;
  let chemParserMock: jasmine.SpyObj<ChemStructureParserService>;
  let reactCloudApiMock: jasmine.SpyObj<ReactCloudApiService>;

  beforeEach(() => {
    existenceCheckServiceMock = jasmine.createSpyObj('ExistenceCheckService', ['checkDatabaseExistence']);
    chemParserMock = jasmine.createSpyObj('ChemStructureParserService', ['translateKetcherToSdf']);
    reactCloudApiMock = jasmine.createSpyObj('ReactCloudApiService', ['uploadUserDataFiles', 'runCommands']);

    TestBed.configureTestingModule({
      providers: [
        TargetMoleculeService,
        { provide: ExistenceCheckService, useValue: existenceCheckServiceMock },
        { provide: ChemStructureParserService, useValue: chemParserMock },
        { provide: ReactCloudApiService, useValue: reactCloudApiMock }
      ]
    });

    service = TestBed.inject(TargetMoleculeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should throw error when molfile is empty', async () => {
    await expectAsync(service.checkTargetMolecule('', 'Temporary')).toBeRejectedWithError(/No molecule structure/);
  });

  it('should detect existing molecule from existence check result', async () => {
    chemParserMock.translateKetcherToSdf.and.returnValue('M  END');
    existenceCheckServiceMock.checkDatabaseExistence.and.resolveTo({
      items: [
        {
          id: '1',
          name: 'Temporary',
          inDatabase: true,
          exactMatch: 'butane',
          dbId: 'butane',
          status: 'Present',
          suggestedAction: 'Use existing DB molecule'
        }
      ],
      hasConflicts: false,
      rawOutput: 'Found exact match butane',
      executionLogText: '',
      logLines: [],
      exitCode: 0,
      success: true,
      dbIdMap: new Map([['Temporary', 'butane']])
    });

    const result = await service.checkTargetMolecule('fake-molfile', 'Temporary');
    expect(result.isExisting).toBeTrue();
    expect(result.matchedDbName).toBe('butane');
    expect(result.effectiveName).toBe('butane');
  });

  it('should return requested name when molecule is new', async () => {
    chemParserMock.translateKetcherToSdf.and.returnValue('M  END');
    existenceCheckServiceMock.checkDatabaseExistence.and.resolveTo({
      items: [
        {
          id: '1',
          name: 'Temporary',
          inDatabase: false,
          exactMatch: 'NONE',
          status: 'New',
          suggestedAction: 'Store in DB'
        }
      ],
      hasConflicts: false,
      rawOutput: 'Not found in database',
      executionLogText: '',
      logLines: [],
      exitCode: 0,
      success: true,
      dbIdMap: new Map()
    });

    const result = await service.checkTargetMolecule('fake-molfile', 'Temporary');
    expect(result.isExisting).toBeFalse();
    expect(result.effectiveName).toBe('Temporary');
  });
});
