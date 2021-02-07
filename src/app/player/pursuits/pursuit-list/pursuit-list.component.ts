import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { PlayerStateService } from '@app/player/player-state.service';
import { InventoryItem, Sort } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { QuestDialogComponent } from './quest-dialog/quest-dialog.component';
import { IconService } from '@app/service/icon.service';
import * as moment from 'moment';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-pursuit-list',
  templateUrl: './pursuit-list.component.html',
  styleUrls: ['./pursuit-list.component.scss']
})
export class PursuitListComponent extends ChildComponent implements OnInit {
  public today =  moment(new Date());
  public displayFilterText: string = null;
  public realFilterText: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  public searchSubject: Subject<void> = new Subject<void>();
  public filteredPursuits: BehaviorSubject<InventoryItem[]> = new BehaviorSubject([]);
  sort: Sort = {
    name: 'expiration',
    ascending: true
  };
  mode: string;

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public state: PlayerStateService,
    private route: ActivatedRoute,
    public dialog: MatDialog) {
    super(storageService);
    this.route.url.pipe(takeUntil(this.unsubscribe$)).subscribe(segments => {
      this.mode = segments[0].path;
      this.filterAndSortPursuits();
    });
    this.displayFilterText = localStorage.getItem('pursuit-filter');
    this.state.player.pipe(
      takeUntil(this.unsubscribe$)).subscribe(p => {
        this.filterAndSortPursuits();
      });
    this.state.trackedPursuits.pipe(
      takeUntil(this.unsubscribe$)).subscribe(p => {
        if (this.mode == 'tracked') {
          this.filterAndSortPursuits();
        }
      });
    this.searchSubject.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(100))
      .subscribe(() => {
        if (this.displayFilterText != null) {
          localStorage.setItem('pursuit-filter', this.displayFilterText);
        } else {
          localStorage.removeItem('pursuit-filter');
        }
        if (this.displayFilterText == null) {
          this.realFilterText.next(null);
        } else {
          this.realFilterText.next(this.displayFilterText.toLowerCase().trim());
        }
        this.filterAndSortPursuits();
      });
    this.searchSubject.next();
  }

  sortData(field: string) {
    if (field === this.sort.name) {
      this.sort.ascending = !this.sort.ascending;
    } else {
      this.sort.ascending = true;
      this.sort.name = field;
    }
    this.filterAndSortPursuits();
  }

  public getTitle() {
    if ('bounties' == this.mode) {
      return 'Bounty';
    } else if ('quests' == this.mode) {
      return 'Quest';
    } else if ('tracked' == this.mode) {
      return 'Pursuit';
    } else {
      return '?';
    }

  }

  private getPursuits(): InventoryItem[] {
    const player = this.state.currPlayer();
    if ('bounties' == this.mode) {
      return player.bounties;
    } else if ('quests' == this.mode) {
      return player.quests;
    } else if ('tracked' == this.mode) {
      return this.state.trackedPursuits.getValue();
    } else {
      return [];
    }
  }


  public openQuestDialog(quest: any): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = quest;
    this.dialog.open(QuestDialogComponent, dc);
  }


  filterAndSortPursuits() {
    const allPursuits = this.getPursuits();
    if (!allPursuits || allPursuits.length == 0) {
      this.filteredPursuits.next([]);
      return;
    }
    const pursuits: InventoryItem[] = [];
    for (const g of allPursuits) {
      if (this.shouldShow(g)) {
        pursuits.push(g);
      }
    }
    PursuitListComponent.sortPursuits(pursuits, this.sort);
    this.filteredPursuits.next(pursuits);
  }

  public static sortPursuits(sortMe: InventoryItem[], sort: Sort) {
    const modifier = sort.ascending ? 1 : -1;
    sortMe.sort((a, b) => {
      let aN: any, bN: any;
      if ('name' == sort.name) {
        aN = a.name;
        bN = b.name;
      } else if ('player' == sort.name) {
        aN = a.owner.getValue().label;
        bN = b.owner.getValue().label;
      } else if ('expiration' == sort.name) {
        aN = a.expirationDate ? a.expirationDate : '4000-09-17T22:30:02Z';
        bN = b.expirationDate ? b.expirationDate : '4000';
      } else if ('progress' == sort.name) {
        aN = a.aggProgress;
        bN = b.aggProgress;
      } else {
        aN = a.name;
        bN = b.name;
      }
      if (aN < bN) {
        return modifier * -1;
      } else if (aN > bN) {
        return modifier * 1;
      }
      return 0;
    });
  }


  private shouldShow(row: InventoryItem): boolean {

    if (this.state.filterChar && this.state.filterChar != 'all') {
      if (row.owner.getValue() != this.state.filterChar) {
        return false;
      }
    }
    if (this.state.hideCompletePursuits) {
      if (row.aggProgress >= 100) {
        return false;
      }
    }
    if (this.realFilterText.getValue() == null || this.realFilterText.getValue().length == 0) {
      return true;
    }
    if (row.searchText.indexOf(this.realFilterText.getValue()) >= 0) {
      return true;
    }
    if (row.owner.getValue().label.toLowerCase().indexOf(this.realFilterText.getValue()) >= 0) {
      return true;
    }
    return false;
  }

  ngOnInit() {
  }


}
