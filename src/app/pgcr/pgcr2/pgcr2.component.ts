
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { Entry, Game, PgcrService, ViewMode } from '@app/service/pgcr.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StorageService } from '../../service/storage.service';
import { PgcrEntryDialogComponent } from '../pgcr-entry-dialog/pgcr-entry-dialog.component';



// https://localhost:4200/pgcr2/8734723341 gambit fireteam
// https://localhost:4200/pgcr2/8799990279 override fireteam
// https://localhost:4200/pgcr2/8829500950 VoG Success
// https://localhost:4200/pgcr2/8746496605 Patrol
// https://localhost:4200/pgcr2/8805145035 Matcmade NF
// https://localhost:4200/pgcr2/6200880412 Rumble
// https://localhost:4200/pgcr2/8798052147 Failed GM NF
// https://localhost:4200/pgcr2/8810508456 pvp momentrum w/ fireteam
// https://localhost:4200/pgcr2/8507432172 Iron Banner w/ fireteam
// https://localhost:4200/pgcr2/8775211882 trials

// Notes, significant gambit stats are present but broken to display 0. These include: 
// invasions, invadasion deaths, invader kills  (NOT invader deaths?)
// Things that work: 
// Reaper: kills (nothing on blockers)
// Collector: Motes picked up and deposited and lost 
// Invader: Guardians Defeated, Motes Denied  (not Primeval Healing, oddly includes Invader Deaths
// Sentry: Primeval Damage (nothing on blockers)
@Component({
  selector: 'd2c-pgcr2',
  templateUrl: './pgcr2.component.html',
  styleUrls: ['./pgcr2.component.scss']
})
export class Pgcr2Component extends ChildComponent implements OnInit, OnDestroy {
  public instanceId$: BehaviorSubject<string | null> = new BehaviorSubject(null);
  public game$: Observable<Game | null>;
  public ViewMode = ViewMode;
  public Object = Object;

  constructor(
    storageService: StorageService,
    private pgcrService: PgcrService,
    public iconService: IconService,
    public dialog: MatDialog,
    private route: ActivatedRoute) {
    super(storageService);
    this.game$ = of(null);
  }

  public findGeneralStat(entry: Entry, stat: string): number {
    const statVal = entry?.general?.find(x => x.statName == stat);
    return statVal?.value;
  }



  public show(entry: Entry): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = entry;
    this.dialog.open(PgcrEntryDialogComponent, dc);
  }

  private async load(instanceId: string): Promise<void> {
    this.instanceId$.next(instanceId);
    this.game$ = this.pgcrService.loadPGCR(instanceId);
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const instanceId = params['instanceId'];
      this.load(instanceId);
    });
  }

}
