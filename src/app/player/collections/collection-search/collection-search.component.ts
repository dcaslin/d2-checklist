import { Component, OnInit, Input, ChangeDetectorRef, Output, EventEmitter, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { TriumphNode, TriumphRecordNode, Player, TriumphCollectibleNode } from '@app/service/model';
import { Subject, of as observableOf, BehaviorSubject, Observable } from 'rxjs';
import { MatTabGroup, MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material';
import { FlatTreeControl } from '@angular/cdk/tree';
import { PlayerStateService } from '../../player-state.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'd2c-collection-search',
  templateUrl: './collection-search.component.html',
  styleUrls: ['./collection-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionSearchComponent extends ChildComponent implements OnInit {
  public searchSubject: Subject<void> = new Subject<void>();
  public filteredCollection: BehaviorSubject<TriumphCollectibleNode[]> = new BehaviorSubject([]);
  public filterText = '';

  constructor(storageService: StorageService,
    public state: PlayerStateService,
    private route: ActivatedRoute,
    private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
  }
  ngOnInit() {
    this.state.player.pipe(
      takeUntil(this.unsubscribe$)).subscribe(p => {
        this.filterCollections();
      });
    this.searchSubject.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(100))
      .subscribe(() => {
        this.filterCollections();
      });
  }

  private filterCollections() {
    const player = this.state.currPlayer();
    if (this.filterText == null || this.filterText.trim().length == 0) {
      this.filteredCollection.next([]);
      return;
    }
    if (player.searchableCollection == null) {
      this.filteredCollection.next([]);
      return;
    }
    const temp = [];
    const filterText = this.filterText.toLowerCase();
    for (const t of player.searchableCollection) {
      if (temp.length > 20) { break; }
      if (t.searchText.indexOf(filterText) >= 0) {
        temp.push(t);
      }
    }
    this.filteredCollection.next(temp);
  }


}
