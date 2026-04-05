
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { Entry, Game, PgcrService, ViewMode } from '@app/service/pgcr.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PgcrEntryDialogComponent } from '../pgcr-entry-dialog/pgcr-entry-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIf, NgFor, NgTemplateOutlet, AsyncPipe, JsonPipe, DecimalPipe, DatePipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';



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
    styleUrls: ['./pgcr2.component.scss'],
    standalone: true,
    imports: [NgIf, FaIconComponent, NgFor, NgTemplateOutlet, MatTooltip, AsyncPipe, JsonPipe, DecimalPipe, DatePipe]
})
export class Pgcr2Component extends ChildComponent implements OnInit {
  public instanceId$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public game$: BehaviorSubject<Game | null> = new BehaviorSubject<Game | null>(null);
  public ViewMode = ViewMode;
  public Object = Object;

  constructor(
    private pgcrService: PgcrService,
    public iconService: IconService,
    public dialog: MatDialog,
    private route: ActivatedRoute) {
    super();
  }

  public findGeneralStat(entry: Entry, stat: string): number {
    const statVal = entry?.general?.find(x => x.statName == stat);
    return statVal?.value!;
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
    const game = await this.pgcrService.loadPGCR(instanceId);
    this.game$.next(game);

  }

  ngOnInit() {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const instanceId = params['instanceId'];
      this.load(instanceId);
    });
  }

}
