import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionTreeComponent } from './collection-tree.component';

describe('CollectionTreeComponent', () => {
  let component: CollectionTreeComponent;
  let fixture: ComponentFixture<CollectionTreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollectionTreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
