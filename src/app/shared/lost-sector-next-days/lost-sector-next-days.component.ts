import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { LostSector } from '@app/service/model';
import { LostSectors, WeekService } from '@app/service/week.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-lost-sector-next-days',
  templateUrl: './lost-sector-next-days.component.html',
  styleUrls: ['./lost-sector-next-days.component.scss']
})
export class LostSectorNextDaysComponent implements OnInit {
  public days: LostSectors[];
  public links = ['Legendary LS', 'Master LS'];
  public activeLink = this.links[0];

  constructor(
    public iconService: IconService,
    private weekService: WeekService
  ) {
    this.days = [];
    for (let cntr = 0; cntr < 30; cntr++) {
      const ls = this.weekService.getLostSectors(cntr);
      this.days.push(ls);
    }
  }

  ngOnInit(): void {
  }

}
