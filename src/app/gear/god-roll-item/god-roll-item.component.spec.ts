import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GodRollItemComponent } from './god-roll-item.component';

describe('GodRollItemComponent', () => {
  let component: GodRollItemComponent;
  let fixture: ComponentFixture<GodRollItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GodRollItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GodRollItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
