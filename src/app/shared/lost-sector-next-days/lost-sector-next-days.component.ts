import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { LostSectors, WeekService } from '@app/service/week.service';
import { BehaviorSubject } from 'rxjs';
import { MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { NgFor, NgIf, AsyncPipe, DatePipe } from '@angular/common';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-lost-sector-next-days',
    templateUrl: './lost-sector-next-days.component.html',
    styleUrls: ['./lost-sector-next-days.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, MatTabNav, NgFor, MatTabLink, MatTabNavPanel, CdkScrollable, MatDialogContent, NgIf, AsyncPipe, DatePipe]
})
export class LostSectorNextDaysComponent {
  public days$: BehaviorSubject<LostSectors[]> = new BehaviorSubject<LostSectors[]>([]);
  public links = ['Legendary LS', 'Master LS'];
  public activeLink = this.links[0];

  constructor(
    public iconService: IconService,
    private weekService: WeekService
  ) {
    this.init();
  }

  private async init() {
    const days: LostSectors[] = [];
    for (let cntr = 0; cntr < 30; cntr++) {
      const ls = await this.weekService.getLostSectors(cntr);
      days.push(ls);
    }
    this.days$.next(days);
  }

}
