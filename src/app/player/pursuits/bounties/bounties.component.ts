import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { PlayerStateService } from '@app/player/player-state.service';
import { InventoryItem } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'd2c-bounties',
  templateUrl: './bounties.component.html',
  styleUrls: ['./bounties.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BountiesComponent extends ChildComponent implements OnInit {
  public displayFilterText: string = null;
  private realFilterText: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  private searchSubject: Subject<void> = new Subject<void>();


  shouldShow(row: InventoryItem): boolean {
    if (this.realFilterText.getValue() == null || this.realFilterText.getValue().length == 0) {
      return true;
    }
    return row.searchText.indexOf(this.realFilterText.getValue()) >= 0;
  }


  constructor(
    storageService: StorageService,
    public state: PlayerStateService) {
    super(storageService);

  }

  ngOnInit() {
    this.displayFilterText = localStorage.getItem('bounty-filter');
    this.searchSubject.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(50))
      .subscribe(() => {
        if (this.displayFilterText != null) {
          localStorage.setItem('bounty-filter', this.displayFilterText);
        } else {
          localStorage.removeItem('bounty-filter');
        }
        if (this.displayFilterText == null) {
          this.realFilterText.next(null);
        } else {
          this.realFilterText.next(this.displayFilterText.toLowerCase().trim());
        }
      });
    this.searchSubject.next();
  }


}
