import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { Player } from '@app/service/model';
import { BehaviorSubject } from 'rxjs';
import { PlayerStateService } from '../player-state.service';

@Component({
  selector: 'd2c-checklist',
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChecklistComponent extends ChildComponent implements OnInit {
  hideComplete: boolean;

  constructor(
    storageService: StorageService,
    public state: PlayerStateService) {
    super(storageService);
    this.hideComplete = localStorage.getItem('hide-completed-checklists') === 'true';

  }

  ngOnInit() {
  }

  public hideCompleteChange() {
    localStorage.setItem('hide-completed-checklists', '' + this.hideComplete);
  }



}
