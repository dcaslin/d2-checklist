import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TriumphMotComponent } from './triumph-mot.component';

describe('TriumphMotComponent', () => {
  let component: TriumphMotComponent;
  let fixture: ComponentFixture<TriumphMotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TriumphMotComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TriumphMotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
