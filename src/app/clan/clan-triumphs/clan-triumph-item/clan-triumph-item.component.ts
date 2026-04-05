import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ClanSearchableTriumph, ClanStateService } from '@app/clan/clan-state.service';
import { IconService } from '@app/service/icon.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanTriumphItemDialogComponent } from '../clan-triumph-item-dialog/clan-triumph-item-dialog.component';
import { NgIf } from '@angular/common';
import { MatIconButton, MatButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-triumph-item',
    templateUrl: './clan-triumph-item.component.html',
    styleUrls: ['./clan-triumph-item.component.scss'],
    standalone: true,
    imports: [NgIf, MatIconButton, FaIconComponent, MatButton, MatProgressBar]
})
export class ClanTriumphItemComponent extends ChildComponent {

  @Input()
  triumph!: ClanSearchableTriumph;


  constructor(public state: ClanStateService,
    public iconService: IconService,
    public dialog: MatDialog) {
    super();
  }

  

  public openTriumphDialog(triumph: ClanSearchableTriumph): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = triumph;
    this.dialog.open(ClanTriumphItemDialogComponent, dc);
  }

}
