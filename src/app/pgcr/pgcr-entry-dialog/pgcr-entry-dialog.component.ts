import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { Entry } from '@app/service/pgcr.service';
import { ChildComponent } from '@app/shared/child.component';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FriendStarComponent } from '../../shared/friend-star/friend-star.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatTabGroup, MatTab, MatTabLabel } from '@angular/material/tabs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'd2c-pgcr-entry-dialog',
    templateUrl: './pgcr-entry-dialog.component.html',
    styleUrls: ['./pgcr-entry-dialog.component.scss'],
    imports: [NgIf, MatDialogTitle, RouterLink, FriendStarComponent, CdkScrollable, MatDialogContent, MatTabGroup, MatTab, MatTabLabel, FaIconComponent, NgFor, DecimalPipe]
})
export class PgcrEntryDialogComponent extends ChildComponent {
  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<PgcrEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public entry: Entry) {
      super();
    }

  
}
