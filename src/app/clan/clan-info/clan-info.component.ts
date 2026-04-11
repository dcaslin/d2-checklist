import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { BungieGroupMember, Sort } from '@app/service/model';
import { ChildComponent } from '@app/shared/child.component';
import { ClanStateService } from '../clan-state.service';
import { NgIf, NgFor, DecimalPipe, DatePipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import { AgoHumanizedPipe, DateFormatPipe } from '../../shared/pipe/timing.pipe';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-info',
    templateUrl: './clan-info.component.html',
    styleUrls: ['./clan-info.component.scss'],
    imports: [NgIf, NgFor, FaIconComponent, MatButton, RouterLink, MatTooltip, AgoHumanizedPipe, DateFormatPipe, DecimalPipe, DatePipe]
})
export class ClanInfoComponent extends ChildComponent {
  sort: Sort = {
    name: 'name',
    ascending: true
  };

  public members = signal<BungieGroupMember[]>([]);

  private static sortMembers(members: BungieGroupMember[], sort: Sort) {
    const modifier = sort.ascending ? 1 : -1;
    if (sort.name == 'name') {
      members.sort((a, b) => {
        const aN = a.destinyUserInfo.displayName;
        const bN = b.destinyUserInfo.displayName;
        if (aN < bN) {
          return modifier * -1;
        } else if (aN > bN) {
          return modifier * 1;
        }
        return 0;
      });
    } else {
      members.sort((a, b) => {
        let aV = (a as any)[sort.name];
        let bV = (b as any)[sort.name];
        if (aV == null) {
          aV = 0;
        } else if (bV == null) {
          bV = 0;
        }
        if (aV < bV) {
          return modifier * -1;
        } else if (aV > bV) {
          return modifier * 1;
        }
        const aN = a.destinyUserInfo.displayName;
        const bN = b.destinyUserInfo.displayName;
        if (aN < bN) {
          return modifier * -1;
        } else if (aN > bN) {
          return modifier * 1;
        }
        return 0;
      });
    }
  }

  sortData(field: string) {
    if (field === this.sort.name) {
      this.sort.ascending = !this.sort.ascending;
    } else {
      this.sort.ascending = true;
      this.sort.name = field;
    }
    this.applySort(this.members().slice(0));
  }


  private applySort(m: BungieGroupMember[]) {
    ClanInfoComponent.sortMembers(m, this.sort);
    this.members.set(m);
  }

  constructor(public iconService: IconService,
    public state: ClanStateService) {
    super();
    effect(() => {
      const rawMembers = this.state.rawMembers();
      this.applySort(rawMembers.slice(0));
    });
  }

}
