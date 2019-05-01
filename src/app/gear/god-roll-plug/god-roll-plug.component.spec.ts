import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GodRollPlugComponent } from './god-roll-plug.component';

describe('GodRollPlugComponent', () => {
  let component: GodRollPlugComponent;
  let fixture: ComponentFixture<GodRollPlugComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GodRollPlugComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GodRollPlugComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
