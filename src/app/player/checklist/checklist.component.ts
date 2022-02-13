import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-checklist',
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.scss']
})
export class ChecklistComponent extends ChildComponent {
  hideComplete: boolean;
  openEntryId: string | null = null;

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public state: PlayerStateService) {
    super(storageService);
    this.hideComplete = localStorage.getItem('hide-completed-checklists') === 'true';

  }

  

  public opened(hash: string) {
    this.openEntryId = hash;
  }

  public hideCompleteChange() {
    localStorage.setItem('hide-completed-checklists', '' + this.hideComplete);
  }
}
