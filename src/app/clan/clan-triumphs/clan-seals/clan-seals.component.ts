import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ClanSeal, ClanStateService } from '@app/clan/clan-state.service';
import { IconService } from '@app/service/icon.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanTriumphSealDialogComponent } from '../clan-triumph-seal-dialog/clan-triumph-seal-dialog.component';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription } from '@angular/material/expansion';
import { MatButton } from '@angular/material/button';
import { ClanTriumphItemComponent } from '../clan-triumph-item/clan-triumph-item.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-seals',
    templateUrl: './clan-seals.component.html',
    styleUrls: ['./clan-seals.component.scss'],
    imports: [NgIf, MatAccordion, NgFor, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription, MatButton, ClanTriumphItemComponent, AsyncPipe]
})
export class ClanSealsComponent extends ChildComponent {
  openEntryId: string|null = null;

  constructor(public state: ClanStateService,
    public iconService: IconService,
    public dialog: MatDialog) {
    super();
  }

  

  public opened(hash: string) {
    this.openEntryId = hash;
  }

  public openSealDialog(triumph: ClanSeal, event: MouseEvent): void {
    event.stopPropagation();
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = triumph;
    this.dialog.open(ClanTriumphSealDialogComponent, dc);
  }

}
