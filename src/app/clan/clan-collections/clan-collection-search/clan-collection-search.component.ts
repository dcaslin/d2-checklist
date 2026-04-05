import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ClanSearchableTriumph, ClanStateService } from '@app/clan/clan-state.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ClanCollectionItemComponent } from '../clan-collection-item/clan-collection-item.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-collection-search',
    templateUrl: './clan-collection-search.component.html',
    styleUrls: ['./clan-collection-search.component.scss'],
    standalone: true,
    imports: [NgIf, MatFormField, MatLabel, MatInput, FormsModule, NgFor, ClanCollectionItemComponent, AsyncPipe]
})
export class ClanCollectionSearchComponent extends ChildComponent implements OnInit {
  private collectionSearchSubject: Subject<void> = new Subject<void>();
  public collectionFilterText: string | null = null;
  public filteredCollection: BehaviorSubject<ClanSearchableTriumph[]> = new BehaviorSubject<ClanSearchableTriumph[]>([]);

  constructor(public state: ClanStateService) {
    super();
    this.collectionFilterText = localStorage.getItem('collection-filter');
  }

  ngOnInit() {
    this.state.searchableTriumphs.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(p => {
        this.filterTriumphs();
      });
    this.collectionSearchSubject.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(50))
      .subscribe(() => {
        const saveMe = this.collectionFilterText == null ? null : this.collectionFilterText.toLowerCase();
        localStorage.setItem('collection-filter', saveMe!);
        this.filterTriumphs();
      });
  }
  collectionSearchChange() {
    this.collectionSearchSubject.next();
  }

  private filterTriumphs() {
    const searchableCollection = this.state.searchableCollection.getValue();
    if (this.collectionFilterText == null || this.collectionFilterText.trim().length == 0) {
      this.filteredCollection.next([]);
      return;
    }
    if (searchableCollection == null) {
      this.filteredCollection.next([]);
      return;
    }
    const temp = [];
    const filterText = this.collectionFilterText.toLowerCase();
    for (const t of searchableCollection) {
      if (temp.length > 20) { break; }
      if (t.data.searchText.indexOf(filterText) >= 0) {
        temp.push(t);
      }
    }
    this.filteredCollection.next(temp as any);
  }

}
