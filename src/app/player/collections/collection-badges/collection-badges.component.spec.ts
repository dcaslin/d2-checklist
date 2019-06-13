import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionBadgesComponent } from './collection-badges.component';

describe('CollectionBadgesComponent', () => {
  let component: CollectionBadgesComponent;
  let fixture: ComponentFixture<CollectionBadgesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollectionBadgesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionBadgesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
