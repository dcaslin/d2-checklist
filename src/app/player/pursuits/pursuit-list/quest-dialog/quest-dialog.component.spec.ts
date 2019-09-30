import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestDialogComponent } from './quest-dialog.component';

describe('QuestDialogComponent', () => {
  let component: QuestDialogComponent;
  let fixture: ComponentFixture<QuestDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuestDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
