import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription } from '@angular/material/expansion';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { MatAnchor } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-triumph-seals',
    templateUrl: './triumph-seals.component.html',
    styleUrls: ['./triumph-seals.component.scss'],
    standalone: true,
    imports: [NgIf, MatCheckbox, FormsModule, MatAccordion, NgFor, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, FaIconComponent, MatTooltip, MatExpansionPanelDescription, MatAnchor, RouterLink, MatProgressBar, AsyncPipe]
})
export class TriumphSealsComponent extends ChildComponent {
  openEntryId: string|null = null;

  constructor(public iconService: IconService,
    public state: PlayerStateService) {
    super();
  }

  public opened(hash: string) {
    this.openEntryId = hash;
  }

  

}
