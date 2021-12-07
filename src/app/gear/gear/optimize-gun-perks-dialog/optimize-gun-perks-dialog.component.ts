import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GearComponent } from '@app/gear';
import { GearService } from '@app/service/gear.service';
import { IconService } from '@app/service/icon.service';
import { InventoryItem } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'd2c-optimize-gun-perks-dialog',
  templateUrl: './optimize-gun-perks-dialog.component.html',
  styleUrls: ['./optimize-gun-perks-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptimizeGunPerksDialogComponent extends ChildComponent implements OnInit {
  parent: GearComponent;
  totalGuns$: BehaviorSubject<number> = new BehaviorSubject(0);
  fixMe$: BehaviorSubject<InventoryItem[]> = new BehaviorSubject([]);
  log$: BehaviorSubject<string[]> = new BehaviorSubject([]);


  constructor(public iconService: IconService,
    public gearService: GearService,
    private notificationService: NotificationService,
    public storageService: StorageService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    super(storageService);
    this.parent = data.parent;

    this.parent.player$.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(player => {
      const fixMe = player.gear.filter(item => item.searchText.indexOf('is:fixme') > 0);
      this.fixMe$.next(fixMe);
    });
  }

  ngOnInit(): void {
  }

  async fixPerks(): Promise<void> {
    console.log('Fixing perks');
    const fixMe = this.fixMe$.getValue();
    await this.gearService.fixPerks(fixMe, this.log$);
    await this.parent.load(true);
    this.notificationService.success(`Fixed ${fixMe.length} items!`);
  }

}
