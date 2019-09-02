import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GamerTagSearchComponent } from './gamer-tag-search.component';

describe('GamerTagSearchComponent', () => {
  let component: GamerTagSearchComponent;
  let fixture: ComponentFixture<GamerTagSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GamerTagSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GamerTagSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
