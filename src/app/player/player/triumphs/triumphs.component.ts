import { Component, OnInit, Input, ChangeDetectorRef, Output, EventEmitter, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { TriumphNode, TriumphRecordNode, Player } from '@app/service/model';
import { Subject, of as observableOf, BehaviorSubject, Observable } from 'rxjs';
import { MatTabGroup, MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material';
import { FlatTreeControl } from '@angular/cdk/tree';

export class TriumphFlatNode {
  constructor(
    public expandable: boolean, public level: number, public data: TriumphNode, public expanded: boolean) { }
}

@Component({
  selector: 'anms-triumphs',
  templateUrl: './triumphs.component.html',
  styleUrls: ['./triumphs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TriumphsComponent extends ChildComponent implements OnInit {
  @ViewChild('triumphtabs') triumphtabs: MatTabGroup;
  private triumphSearchSubject: Subject<void> = new Subject<void>();
  public seasonIndex = 0;
  public triumphFilterText: string = null;
  public filteredTriumphs: BehaviorSubject<TriumphRecordNode[]> = new BehaviorSubject([]);
  public trackedTriumphs: BehaviorSubject<TriumphRecordNode[]> = new BehaviorSubject([]);
  showZeroPtTriumphs = false;
  showInvisTriumphs = false;
  aTrackedTriumphIds = [];
  dTrackedTriumphIds = {};
  triumphTreeControl: FlatTreeControl<any>;
  treeFlattener2: MatTreeFlattener<TriumphNode, TriumphFlatNode>;
  recordDatasource: MatTreeFlatDataSource<any, TriumphFlatNode>;

  @Input() selectedTab: string;

  @Input() selectedTreeNodeHash: string;

  @Input() hideComplete: boolean;

  @Input()
  set currPlayer(arg: Player) {
    this.player = arg;
    this.init();
  }

  @Output() nodeClicked = new EventEmitter<string>();
  @Output() refreshPlayer = new EventEmitter<void>();

  player: Player;

  constructor(
    storageService: StorageService,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
    this.triumphTreeControl = new FlatTreeControl<TriumphFlatNode>(this._getLevel, this._isExpandable);
    this.treeFlattener2 = new MatTreeFlattener(this.transformer2, this._getLevel, this._isExpandable, this._getChildren);
    this.hideComplete = localStorage.getItem('hide-completed-triumphs') === 'true';
    this.showZeroPtTriumphs = localStorage.getItem('show-zero-pt-triumphs') === 'true';
    this.showInvisTriumphs = localStorage.getItem('show-invis-triumphs') === 'true';
    this.loadTrackedTriumphIds();
  }

  public hideCompleteChange() {
    localStorage.setItem('hide-completed-triumphs', '' + this.hideComplete);
  }


  private init() {
    this.recordDatasource = new MatTreeFlatDataSource(this.triumphTreeControl, this.treeFlattener2);
    this.recordDatasource.data = this.player.records;
    this.filterTriumphs();
    this.setTrackedTriumphs();
    this.seasonIndex = 0;
    if (this.selectedTab === 'triumphs') {
      if (this.selectedTreeNodeHash != null) {
        for (const n of this.triumphTreeControl.dataNodes) {
          if (n.data.hash === +this.selectedTreeNodeHash) {
            this.triumphTreeControl.expand(n);
            this.expandParents(this.triumphTreeControl, n);
            break;
          }
        }
      }
    }
  }

  ngOnInit() {
    this.triumphSearchSubject.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(50))
      .subscribe(() => {
        this.filterTriumphs();
      });
  }

  private getParentNode(tree: FlatTreeControl<any>, node: TriumphFlatNode): TriumphFlatNode {
    const currentLevel = tree.getLevel(node);
    if (currentLevel < 1) {
      return null;
    }
    const startIndex = tree.dataNodes.indexOf(node) - 1;
    for (let i = startIndex; i >= 0; i--) {
      const currentNode = tree.dataNodes[i];
      if (tree.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
  }


  private expandParents(tree: FlatTreeControl<any>, node: TriumphFlatNode): void {
    const parent = this.getParentNode(tree, node);
    tree.expand(parent);
    if (parent && parent.level > 0) {
      this.expandParents(tree, parent);
    }
  }

  triumphSearchChange() {
    this.triumphSearchSubject.next();
  }

  private filterTriumphs() {
    if (this.triumphFilterText == null || this.triumphFilterText.trim().length == 0) {
      this.filteredTriumphs.next([]);
      return;
    }
    if (this.player.searchableTriumphs == null) {
      this.filteredTriumphs.next([]);
      return;
    }
    const temp = [];
    const filterText = this.triumphFilterText.toLowerCase();
    for (const t of this.player.searchableTriumphs) {
      if (temp.length > 20) { break; }
      if (t.searchText.indexOf(filterText) >= 0) {
        temp.push(t);
      }
    }
    this.filteredTriumphs.next(temp);
  }

  private jumpToTriumph(targetHash: number) {
    this.triumphTreeControl.collapseAll();
    this.triumphtabs.selectedIndex = 0;
    for (const n of this.triumphTreeControl.dataNodes) {
      if (n.data.hash === targetHash) {
        this.triumphTreeControl.expand(n);
        this.expandParents(this.triumphTreeControl, n);
        this.selectedTreeNodeHash = '' + targetHash;
        break;
      }
    }
  }

  private loadTrackedTriumphIds() {
    const sTrackedIds = localStorage.getItem('tracked-triumph-ids');
    if (sTrackedIds != null) {
      this.aTrackedTriumphIds = JSON.parse(sTrackedIds);
    } else {
      this.aTrackedTriumphIds = [];
    }
    this.dTrackedTriumphIds = {};
    for (const t of this.aTrackedTriumphIds) {
      this.dTrackedTriumphIds[t] = true;
    }
  }

  public trackTriumph(n: TriumphRecordNode) {
    this.aTrackedTriumphIds.push(n.hash);
    this.saveTrackedTriumphIds();
    this.loadTrackedTriumphIds();
    this.setTrackedTriumphs();
  }

  public untrackTriumph(n: TriumphRecordNode) {
    const index = this.aTrackedTriumphIds.indexOf(n.hash);
    this.aTrackedTriumphIds.splice(index, 1);
    this.saveTrackedTriumphIds();
    this.loadTrackedTriumphIds();
    this.setTrackedTriumphs();
  }

  public showZeroPtTriumphsChange() {
    localStorage.setItem('show-zero-pt-triumphs', '' + this.showZeroPtTriumphs);
    this.refreshPlayer.emit();
  }

  public showInvisTriumphsChange() {
    localStorage.setItem('show-invis-triumphs', '' + this.showInvisTriumphs);
    this.refreshPlayer.emit();
  }


  public restoreHiddenClosestTriumphs() {
    localStorage.removeItem('hidden-closest-triumphs');
    this.refreshPlayer.emit();
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
    this.refreshPlayer.emit();
  }



  private saveTrackedTriumphIds() {
    localStorage.setItem('tracked-triumph-ids', JSON.stringify(this.aTrackedTriumphIds));
  }

  transformer2 = (node: TriumphNode, level: number) => {
    return new TriumphFlatNode(!!node.children, level, node, true);
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
    for (const t of this.player.searchableTriumphs) {
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

  private setTrackedTriumphs() {
    const tempTriumphs = [];
    if (this.aTrackedTriumphIds.length > 0 && this.player.searchableTriumphs != null) {
      for (const t of this.player.searchableTriumphs) {
        if (this.dTrackedTriumphIds[t.hash] == true) {
          tempTriumphs.push(t);
        }
      }
    }
    this.trackedTriumphs.next(tempTriumphs);
  }


  private _getLevel = (node: TriumphFlatNode) => node.level;

  private _isExpandable = (node: TriumphFlatNode) => node.expandable;

  private _getChildren = (node: any): Observable<any[]> => observableOf(node.children);

  hasChild = (_: number, _nodeData: TriumphFlatNode) => _nodeData.expandable;

  hideNode = (_nodeData: TriumphFlatNode) => this.hideComplete && _nodeData.data.complete;



}

