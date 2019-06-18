import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PursuitsComponent } from './pursuits.component';

describe('PursuitsComponent', () => {
  let component: PursuitsComponent;
  let fixture: ComponentFixture<PursuitsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PursuitsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PursuitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
