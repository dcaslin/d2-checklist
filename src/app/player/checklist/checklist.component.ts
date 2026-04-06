import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription } from '@angular/material/expansion';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-checklist',
    templateUrl: './checklist.component.html',
    styleUrls: ['./checklist.component.scss'],
    imports: [NgIf, MatAccordion, NgFor, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, FaIconComponent, MatExpansionPanelDescription, MatCheckbox, FormsModule, AsyncPipe]
})
export class ChecklistComponent extends ChildComponent {
  hideComplete: boolean;
  openEntryId: string | null = null;

  constructor(
    public iconService: IconService,
    public state: PlayerStateService) {
    super();
    this.hideComplete = localStorage.getItem('hide-completed-checklists') === 'true';

  }

  

  public opened(hash: string) {
    this.openEntryId = hash;
  }

  public hideCompleteChange() {
    localStorage.setItem('hide-completed-checklists', '' + this.hideComplete);
  }
}
