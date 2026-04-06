import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { GearComponent } from '@app/gear';
import { GearService } from '@app/service/gear.service';
import { IconService } from '@app/service/icon.service';
import { InventoryItem } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton, MatButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';

@Component({
    selector: 'd2c-optimize-gun-perks-dialog',
    templateUrl: './optimize-gun-perks-dialog.component.html',
    styleUrls: ['./optimize-gun-perks-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatDialogTitle,
        MatIconButton,
        FaIconComponent,
        CdkScrollable,
        MatDialogContent,
        NgIf,
        NgFor,
        MatDialogActions,
        MatButton,
        MatDialogClose,
        AsyncPipe,
    ]
})
export class OptimizeGunPerksDialogComponent extends ChildComponent {
  parent: GearComponent;
  totalGuns$: BehaviorSubject<number> = new BehaviorSubject(0);
  fixMe$: BehaviorSubject<InventoryItem[]> = new BehaviorSubject<InventoryItem[]>([]);
  log$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);


  constructor(public iconService: IconService,
    public gearService: GearService,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    super();
    this.parent = data.parent;

    this.parent.player$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(player => {
      const fixMe = player!.gear.filter(item => item.searchText.indexOf('is:fixme') > 0);
      this.fixMe$.next(fixMe);
    });
  }


  async fixPerks(): Promise<void> {
    console.log('Fixing perks');
    const fixMe = this.fixMe$.getValue();
    await this.gearService.fixPerks(fixMe, this.log$);
    await this.parent.load(true);
    this.notificationService.success(`Fixed ${fixMe.length} items!`);
  }

}
