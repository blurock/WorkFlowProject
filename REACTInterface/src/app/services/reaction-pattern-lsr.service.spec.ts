import { TestBed } from '@angular/core/testing';
import { ReactionPatternLsrService } from './reaction-pattern-lsr.service';

describe('ReactionPatternLsrService', () => {
  let service: ReactionPatternLsrService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReactionPatternLsrService]
    });
    service = TestBed.inject(ReactionPatternLsrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate LSR format with NONE when no auxiliary molecules are provided', () => {
    const lsr = service.generateLsrContent(
      'Alkane Decomposition',
      [],
      ['Decomp-(rhh)(hhh)', 'Decomp-(rhh)(rhh)']
    );

    const lines = lsr.trim().split('\n');
    expect(lines[0]).toBe('Alkane Decomposition');
    expect(lines[1]).toBe('NONE');
    expect(lines[2]).toContain('%%%');
    expect(lines[3]).toBe('Decomp-(rhh)(hhh),\\');
    expect(lines[4]).toBe('Decomp-(rhh)(rhh)');
  });

  it('should generate LSR format with auxiliary molecules and colon suffix', () => {
    const lsr = service.generateLsrContent(
      'Hydrogen Abstraction Test',
      ['hydroxyl-radical', 'oxygen'],
      ['H-Abstraction-Hydroxyl-Radical-Primary', 'H-Abstraction-Oxygen-Primary']
    );

    const lines = lsr.trim().split('\n');
    expect(lines[0]).toBe('Hydrogen Abstraction Test');
    expect(lines[1]).toBe('hydroxyl-radical,oxygen');
    expect(lines[2]).toContain('%%%');
    expect(lines[3]).toBe('H-Abstraction-Hydroxyl-Radical-Primary,\\');
    expect(lines[4]).toBe('H-Abstraction-Oxygen-Primary,\\');
    expect(lines[5]).toBe(':hydroxyl-radical,oxygen');
  });

  it('should handle empty pattern lists gracefully', () => {
    const lsr = service.generateLsrContent('Empty', [], []);
    expect(lsr).toContain('NONE');
    expect(lsr).toContain('%%% No reaction patterns specified');
  });
});
