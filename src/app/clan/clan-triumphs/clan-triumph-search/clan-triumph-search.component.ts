import { ChangeDetectionStrategy, Component, effect, OnInit, signal } from '@angular/core';
import { ClanSearchableTriumph, ClanStateService } from '@app/clan/clan-state.service';
import { ChildComponent } from '@app/shared/child.component';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { IconService } from '@app/service/icon.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIf, NgFor } from '@angular/common';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ClanTriumphItemComponent } from '../clan-triumph-item/clan-triumph-item.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-triumph-search',
    templateUrl: './clan-triumph-search.component.html',
    styleUrls: ['./clan-triumph-search.component.scss'],
    imports: [NgIf, MatFormField, MatLabel, MatInput, FormsModule, NgFor, ClanTriumphItemComponent]
})
export class ClanTriumphSearchComponent extends ChildComponent implements OnInit {
  private triumphSearchSubject: Subject<void> = new Subject<void>();
  public triumphFilterText: string | null = null;
  public filteredTriumphs = signal<ClanSearchableTriumph[]>([]);

  constructor(public state: ClanStateService, public iconService: IconService) {
    super();
    this.triumphFilterText = localStorage.getItem('triumph-filter');
    effect(() => {
      const _triumphs = this.state.searchableTriumphs();
      this.filterTriumphs();
    });
  }

  ngOnInit() {
    this.triumphSearchSubject.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(50))
      .subscribe(() => {
        const saveMe = this.triumphFilterText == null ? null : this.triumphFilterText.toLowerCase();
        localStorage.setItem('triumph-filter', saveMe!);
        this.filterTriumphs();
      });
  }
  triumphSearchChange() {
    this.triumphSearchSubject.next();
  }

  private filterTriumphs() {
    const searchableTriumphs = this.state.searchableTriumphs();
    if (this.triumphFilterText == null || this.triumphFilterText.trim().length == 0) {
      this.filteredTriumphs.set([]);
      return;
    }
    if (searchableTriumphs == null) {
      this.filteredTriumphs.set([]);
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
    this.filteredTriumphs.set(temp);
  }

}
