import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BungieGroupMember } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ClanStateService, Sort } from '../clan-state.service';

@Component({
  selector: 'd2c-clan-info',
  templateUrl: './clan-info.component.html',
  styleUrls: ['./clan-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanInfoComponent extends ChildComponent implements OnInit {
  sort: Sort = {
    name: 'name',
    ascending: true
  };

  public members: BehaviorSubject<BungieGroupMember[]> = new BehaviorSubject([]);

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
        let aV = a[sort.name];
        let bV = b[sort.name];
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
    this.applySort(this.members.getValue());

  }


  private applySort(m: BungieGroupMember[]) {
    ClanInfoComponent.sortMembers(m, this.sort);
    this.members.next(m);
  }

  constructor(storageService: StorageService,
    public state: ClanStateService) {
    super(storageService);
    this.state.rawMembers.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe((rawMembers) => {
        this.applySort(rawMembers.slice(0));
      });
  }

  ngOnInit() {
  }

}
