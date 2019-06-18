import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestsComponent } from './quests.component';

describe('QuestsComponent', () => {
  let component: QuestsComponent;
  let fixture: ComponentFixture<QuestsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuestsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
