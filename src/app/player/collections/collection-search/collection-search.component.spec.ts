import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionSearchComponent } from './collection-search.component';

describe('CollectionSearchComponent', () => {
  let component: CollectionSearchComponent;
  let fixture: ComponentFixture<CollectionSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollectionSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
