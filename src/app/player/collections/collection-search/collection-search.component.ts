import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { TriumphCollectibleNode } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { PlayerStateService } from '../../player-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-collection-search',
  templateUrl: './collection-search.component.html',
  styleUrls: ['./collection-search.component.scss']
})
export class CollectionSearchComponent extends ChildComponent implements OnInit {
  public searchSubject: Subject<void> = new Subject<void>();
  public filteredCollection: BehaviorSubject<TriumphCollectibleNode[]> = new BehaviorSubject([]);
  public filterText = '';

  constructor(storageService: StorageService,
    public iconService: IconService,
    public state: PlayerStateService) {
    super(storageService);
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
