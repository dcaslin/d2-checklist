import { Component, OnInit, Input, ChangeDetectorRef, Output, EventEmitter, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { TriumphNode, TriumphRecordNode, Player } from '@app/service/model';
import { Subject, of as observableOf, BehaviorSubject, Observable } from 'rxjs';
import { MatTabGroup, MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material';
import { FlatTreeControl } from '@angular/cdk/tree';
import { PlayerStateService } from '../player-state.service';

@Component({
  selector: 'd2c-triumphs',
  templateUrl: './triumphs.component.html',
  styleUrls: ['./triumphs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TriumphsComponent extends ChildComponent implements OnInit {
  @ViewChild('triumphtabs') triumphtabs: MatTabGroup;
  private triumphSearchSubject: Subject<void> = new Subject<void>();
  public triumphFilterText: string = null;
  public filteredTriumphs: BehaviorSubject<TriumphRecordNode[]> = new BehaviorSubject([]);



  constructor(
    storageService: StorageService,
    public state: PlayerStateService,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
  }

  ngOnInit() {
    this.state.player.pipe(
      takeUntil(this.unsubscribe$)).subscribe(p => {
        this.filterTriumphs();
      });
    this.triumphSearchSubject.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(50))
      .subscribe(() => {
        this.filterTriumphs();
      });
  }


  triumphSearchChange() {
    this.triumphSearchSubject.next();
  }

  private filterTriumphs() {
    const player = this.state.currPlayer();
    if (this.triumphFilterText == null || this.triumphFilterText.trim().length == 0) {
      this.filteredTriumphs.next([]);
      return;
    }
    if (player.searchableTriumphs == null) {
      this.filteredTriumphs.next([]);
      return;
    }
    const temp = [];
    const filterText = this.triumphFilterText.toLowerCase();
    for (const t of player.searchableTriumphs) {
      if (temp.length > 20) { break; }
      if (t.searchText.indexOf(filterText) >= 0) {
        temp.push(t);
      }
    }
    this.filteredTriumphs.next(temp);
  }


  public restoreHiddenClosestTriumphs() {
    localStorage.removeItem('hidden-closest-triumphs');
    this.state.requestRefresh();
  }

  public hideClosestTriumph(n: TriumphRecordNode) {
    const sHideMe = localStorage.getItem('hidden-closest-triumphs');
    let hidden = [];
    if (sHideMe != null) {
      try {
        hidden = JSON.parse(sHideMe);
      } catch (exc) {
        console.dir(exc);
      }
    }
    hidden.push(n.hash);
    localStorage.setItem('hidden-closest-triumphs', JSON.stringify(hidden));
    this.state.requestRefresh();
  }



  private static replaceAll(src: string, find: string, replace: string): string {
    while (true) {
      const newS = src.replace(find, replace);
      if (newS == src) {
        break;
      }
      src = newS;
    }
    return src;
  }


  private static escape(s: string) {
    if (s == null) { return s; }
    s = TriumphsComponent.replaceAll(s, ',', ' ');
    s = TriumphsComponent.replaceAll(s, '"', '');
    s = TriumphsComponent.replaceAll(s, '\r\n', 'y');
    s = TriumphsComponent.replaceAll(s, '\n', 'x');
    return s;
  }


  public downloadCsvTriumphs() {
    const header = 'Name,Path,Score,Percent,Complete,Redeemed,Description';
    let rows = [];
    for (const t of this.state.currPlayer().searchableTriumphs) {
      let sCsv = TriumphsComponent.escape(t.name) + ',';
      let sPath = '';
      for (const e of t.path) {
        sPath = sPath + e.path + ' / ';
      }
      sCsv += TriumphsComponent.escape(sPath) + ',';
      sCsv += t.score + ',';
      sCsv += t.percent + ',';
      sCsv += t.complete + ',';
      sCsv += t.redeemed + ',';
      sCsv += TriumphsComponent.escape(t.desc);
      rows.push(sCsv);
    }
    rows = rows.sort();
    let sReport = header;
    sReport += '\n';
    for (const r of rows) {
      sReport += r;
      sReport += '\n';
    }
    const sDate = new Date().toISOString().slice(0, 10);
    this.downloadCsv('player-triumphs-' + sDate + '.csv', sReport);
  }

  private downloadCsv(filename: string, csv: string) {
    const anch: HTMLAnchorElement = document.createElement('a');
    anch.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    anch.setAttribute('download', filename);
    anch.setAttribute('visibility', 'hidden');
    document.body.appendChild(anch);
    anch.click();
  }

}

