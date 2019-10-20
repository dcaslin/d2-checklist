import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { PlayerStateService } from '../player-state.service';
import { IconService } from '@app/service/icon.service';

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
    public iconService: IconService,
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
