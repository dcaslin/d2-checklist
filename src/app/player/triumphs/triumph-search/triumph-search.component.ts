import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { TriumphRecordNode } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { PlayerStateService } from '../../player-state.service';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-triumph-search',
  templateUrl: './triumph-search.component.html',
  styleUrls: ['./triumph-search.component.scss']
})
export class TriumphSearchComponent extends ChildComponent implements OnInit {
  public MAX_RESULTS = 30;
  private triumphSearchSubject: Subject<void> = new Subject<void>();
  public triumphFilterText: string = null;
  public filteredTriumphs: BehaviorSubject<TriumphRecordNode[]> = new BehaviorSubject([]);
  public hasMore$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    public iconService: IconService,
    public state: PlayerStateService) {
    super(storageService);
    this.triumphFilterText = localStorage.getItem('triumph-filter');
  }

  navigate(triumphHash: string) {
    this.router.navigate(['..', 'tree', triumphHash], { relativeTo: this.route});
  }

  ngOnInit() {
    this.state.player.pipe(
      takeUntil(this.unsubscribe$)).subscribe(p => {
        this.filterTriumphs();
      });
    this.triumphSearchSubject.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(50))
      .subscribe(() => {
        const saveMe = this.triumphFilterText == null ? null : this.triumphFilterText.toLowerCase();
        localStorage.setItem('triumph-filter', saveMe);
        this.filterTriumphs();
      });
  }
  triumphSearchChange() {
    this.triumphSearchSubject.next();
  }

  private filterTriumphs() {
    this.hasMore$.next(false);
    const player = this.state.currPlayer();
    if (this.triumphFilterText == null || this.triumphFilterText.trim().length == 0) {
      this.filteredTriumphs.next([]);
      return;
    }
    if (player.searchableTriumphs == null) {
      this.filteredTriumphs.next([]);
      return;
    }
    const temp = [];
    const filterText = this.triumphFilterText.toLowerCase();
    for (const t of player.searchableTriumphs) {
      if (temp.length > this.MAX_RESULTS) {
        this.hasMore$.next(true);
        break;
      }
      if (t.searchText.indexOf(filterText) >= 0) {
        if (!this.state.hideCompleteTriumphs || !t.complete || !t.redeemed) {
          temp.push(t);
        }
      }
    }
    this.filteredTriumphs.next(temp);
  }


}
