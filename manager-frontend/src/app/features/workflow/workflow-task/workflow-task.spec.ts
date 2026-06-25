import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowTask } from './workflow-task';

describe('WorkflowTask', () => {
  let component: WorkflowTask;
  let fixture: ComponentFixture<WorkflowTask>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowTask],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowTask);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
