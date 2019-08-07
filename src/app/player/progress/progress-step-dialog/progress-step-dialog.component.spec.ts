import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressStepDialogComponent } from './progress-step-dialog.component';

describe('ProgressStepDialogComponent', () => {
  let component: ProgressStepDialogComponent;
  let fixture: ComponentFixture<ProgressStepDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProgressStepDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressStepDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
