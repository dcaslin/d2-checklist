import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ClanSearchableTriumph, ClanStateService } from '@app/clan/clan-state.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { IconService } from '@app/service/icon.service';

@Component({
  selector: 'd2c-clan-triumph-search',
  templateUrl: './clan-triumph-search.component.html',
  styleUrls: ['./clan-triumph-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanTriumphSearchComponent extends ChildComponent implements OnInit {
  private triumphSearchSubject: Subject<void> = new Subject<void>();
  public triumphFilterText: string = null;
  public filteredTriumphs: BehaviorSubject<ClanSearchableTriumph[]> = new BehaviorSubject([]);

  constructor(storageService: StorageService, public state: ClanStateService, public iconService: IconService) {
    super(storageService);
    this.triumphFilterText = localStorage.getItem('triumph-filter');
  }

  ngOnInit() {
    this.state.searchableTriumphs.pipe(
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
    const searchableTriumphs = this.state.searchableTriumphs.getValue();
    if (this.triumphFilterText == null || this.triumphFilterText.trim().length == 0) {
      this.filteredTriumphs.next([]);
      return;
    }
    if (searchableTriumphs == null) {
      this.filteredTriumphs.next([]);
      return;
    }
    const temp = [];
    const filterText = this.triumphFilterText.toLowerCase();
    for (const t of searchableTriumphs) {
      if (temp.length > 20) { break; }
      if (t.data.searchText.indexOf(filterText) >= 0) {
        temp.push(t);
      }
    }
    this.filteredTriumphs.next(temp);
  }

}
