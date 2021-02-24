import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { BurnDialogComponent } from '@app/home/burn-dialog/burn-dialog.component';
import { IconService } from '@app/service/icon.service';
import { LostSector, MilestoneActivity } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-legendary-lost-sector',
  templateUrl: './legendary-lost-sector.component.html',
  styleUrls: ['./legendary-lost-sector.component.scss'],

})
export class LegendaryLostSectorComponent extends ChildComponent implements OnInit {

  @Input()
  ls: LostSector;

  constructor(
    storageService: StorageService,
    public dialog: MatDialog,
    public iconService: IconService
  ) {
    super(storageService);
  }

  ngOnInit(): void {
  }

  showBurns(msa: MilestoneActivity) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = msa;
    this.dialog.open(BurnDialogComponent, dc);
  }

  
}
