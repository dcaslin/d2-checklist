import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router } from '@angular/router';
import { BungieService } from '@app/service/bungie.service';
import { Const, Player, InventoryItem } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'anms-bounties',
  templateUrl: './bounties.component.html',
  styleUrls: ['./bounties.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BountiesComponent extends ChildComponent implements OnInit {

  @Input() player: Player;
  public displayFilterText: string = null;
  private realFilterText: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  private searchSubject: Subject<void> = new Subject<void>();



  shouldShow(row: InventoryItem): boolean {
    if (this.realFilterText.getValue() == null || this.realFilterText.getValue().length == 0) { return true; }
    return row.searchText.indexOf(this.realFilterText.getValue()) >= 0;
  }


  constructor(
    storageService: StorageService,
    private bungieService: BungieService,
    private ref: ChangeDetectorRef,
    public dialog: MatDialog) {
    super(storageService, ref);

  }


  ngOnInit() {

    this.displayFilterText = localStorage.getItem('bounty-filter');
    this.searchSubject.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(50))
      .subscribe(() => {
        console.log('change');
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

  public openQuestDialog(quest: any): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    // dc.width = '500px';
    dc.data = quest;
    const dialogRef = this.dialog.open(QuestDialogComponent, dc);
  }


}

@Component({
  selector: 'anms-quest-dialog',
  templateUrl: './quest-dialog.component.html',
  styleUrls: ['./quest-dialog.component.scss']
})
export class QuestDialogComponent {
  public const: Const = Const;
  constructor(
    public dialogRef: MatDialogRef<QuestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

}
