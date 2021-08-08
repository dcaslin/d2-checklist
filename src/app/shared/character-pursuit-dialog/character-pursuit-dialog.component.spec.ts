import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterPursuitDialogComponent } from './character-pursuit-dialog.component';

describe('CharacterPursuitDialogComponent', () => {
  let component: CharacterPursuitDialogComponent;
  let fixture: ComponentFixture<CharacterPursuitDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CharacterPursuitDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CharacterPursuitDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
