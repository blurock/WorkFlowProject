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

  it('should ignore Temporary as an existing match candidate', async () => {
    chemParserMock.translateKetcherToSdf.and.returnValue('M  END');
    existenceCheckServiceMock.checkDatabaseExistence.and.resolveTo({
      items: [
        {
          id: '1',
          name: '1-butyl-radical',
          inDatabase: true,
          exactMatch: 'Temporary',
          dbId: '10019',
          status: 'Present',
          suggestedAction: 'Use existing DB molecule'
        }
      ],
      hasConflicts: false,
      rawOutput: '1-butyl-radical 10019 EXISTS (Temporary)',
      executionLogText: '',
      logLines: [],
      exitCode: 0,
      success: true,
      dbIdMap: new Map([['1-butyl-radical', '10019']])
    });

    const result = await service.checkTargetMolecule('fake-molfile', '1-butyl-radical');
    expect(result.isExisting).toBeFalse();
    expect(result.matchedDbName).toBeUndefined();
    expect(result.effectiveName).toBe('1-butyl-radical');
  });

  it('should generate safe unique name when storing molecule with Temporary or empty name', async () => {
    reactCloudApiMock.uploadUserDataFiles.and.returnValue(of({ success: true, targetDir: '', files: ['foo.sdf'] }));
    reactCloudApiMock.runCommands.and.returnValue(of({ root: 'Temp', exitCode: 0, output: 'Stored successfully' }));

    const res = await service.storeTargetMolecule('Temporary', 'fake-sdf');
    expect(res.success).toBeTrue();
    expect(reactCloudApiMock.uploadUserDataFiles).toHaveBeenCalled();
    const uploadCallArg = reactCloudApiMock.uploadUserDataFiles.calls.mostRecent().args[1][0];
    expect(uploadCallArg.filename).toMatch(/^Temp_\d+\.sdf$/);
  });
});
