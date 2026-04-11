import { ChangeDetectionStrategy, Component, effect, OnInit, signal } from '@angular/core';
import { ClanSearchableCollection, ClanStateService } from '@app/clan/clan-state.service';
import { ChildComponent } from '@app/shared/child.component';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIf, NgFor } from '@angular/common';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ClanCollectionItemComponent } from '../clan-collection-item/clan-collection-item.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-collection-search',
    templateUrl: './clan-collection-search.component.html',
    styleUrls: ['./clan-collection-search.component.scss'],
    imports: [NgIf, MatFormField, MatLabel, MatInput, FormsModule, NgFor, ClanCollectionItemComponent]
})
export class ClanCollectionSearchComponent extends ChildComponent implements OnInit {
  private collectionSearchSubject: Subject<void> = new Subject<void>();
  public collectionFilterText: string | null = null;
  public filteredCollection = signal<ClanSearchableCollection[]>([]);

  constructor(public state: ClanStateService) {
    super();
    this.collectionFilterText = localStorage.getItem('collection-filter');
    effect(() => {
      const _collections = this.state.searchableCollection();
      this.filterCollections();
    });
  }

  ngOnInit() {
    this.collectionSearchSubject.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(50))
      .subscribe(() => {
        const saveMe = this.collectionFilterText == null ? null : this.collectionFilterText.toLowerCase();
        localStorage.setItem('collection-filter', saveMe!);
        this.filterCollections();
      });
  }
  collectionSearchChange() {
    this.collectionSearchSubject.next();
  }

  private filterCollections() {
    const searchableCollection = this.state.searchableCollection();
    if (this.collectionFilterText == null || this.collectionFilterText.trim().length == 0) {
      this.filteredCollection.set([]);
      return;
    }
    if (searchableCollection == null) {
      this.filteredCollection.set([]);
      return;
    }
    const temp: ClanSearchableCollection[] = [];
    const filterText = this.collectionFilterText.toLowerCase();
    for (const t of searchableCollection) {
      if (temp.length > 20) { break; }
      if (t.data.searchText.indexOf(filterText) >= 0) {
        temp.push(t);
      }
    }
    this.filteredCollection.set(temp);
  }

}
