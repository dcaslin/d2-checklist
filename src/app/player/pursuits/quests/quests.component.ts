import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { PlayerStateService } from '@app/player/player-state.service';
import { InventoryItem } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { QuestDialogComponent } from './quest-dialog/quest-dialog.component';

@Component({
  selector: 'd2c-quests',
  templateUrl: './quests.component.html',
  styleUrls: ['./quests.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestsComponent  extends ChildComponent implements OnInit {
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
    public state: PlayerStateService,
    private ref: ChangeDetectorRef,
    public dialog: MatDialog) {
    super(storageService, ref);

  }

  ngOnInit() {
    this.displayFilterText = localStorage.getItem('quest-filter');
    this.searchSubject.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(50))
      .subscribe(() => {
        if (this.displayFilterText != null) {
          localStorage.setItem('quest-filter', this.displayFilterText);
        } else {
          localStorage.removeItem('quest-filter');
        }
        if (this.displayFilterText == null) {
          this.realFilterText.next(null);
        } else {
          this.realFilterText.next(this.displayFilterText.toLowerCase().trim());
        }
      });
    this.searchSubject.next();
  }


  public openQuestDialog(quest: any): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    // dc.width = '500px';
    dc.data = quest;
    const dialogRef = this.dialog.open(QuestDialogComponent, dc);
  }


}
