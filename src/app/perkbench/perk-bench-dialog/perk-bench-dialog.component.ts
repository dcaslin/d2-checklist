import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { MappedRoll } from '../perkbench.component';

@Component({
  selector: 'd2c-perk-bench-dialog',
  templateUrl: './perk-bench-dialog.component.html',
  styleUrls: ['./perk-bench-dialog.component.scss']
})
export class PerkBenchDialogComponent extends ChildComponent implements OnInit {
  r: MappedRoll;
  maxPlugs = 0;

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public dialogRef: MatDialogRef<PerkBenchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    super(storageService);
    this.r = data.item;

    for (const s of this.r.info.sockets) {
      if (s.possiblePlugs.length > this.maxPlugs) {
        this.maxPlugs = s.possiblePlugs.length;
      }
    }
  }

  makeArray(n: number): any[] {
    return Array(n);
  }


  ngOnInit() {
  }

}
