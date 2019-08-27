import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LifetimeComponent } from './lifetime.component';

describe('LifetimeComponent', () => {
  let component: LifetimeComponent;
  let fixture: ComponentFixture<LifetimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LifetimeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LifetimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
