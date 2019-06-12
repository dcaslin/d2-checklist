import { Component, OnInit, Input, ChangeDetectorRef, Output, EventEmitter, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { TriumphNode, TriumphRecordNode, Player } from '@app/service/model';
import { Subject, of as observableOf, BehaviorSubject, Observable } from 'rxjs';
import { MatTabGroup, MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material';
import { FlatTreeControl } from '@angular/cdk/tree';
import { PlayerStateService } from '../../player-state.service';
import { Router, ActivatedRoute } from '@angular/router';

export class TriumphFlatNode {
  constructor(
    public expandable: boolean, public level: number, public data: TriumphNode, public expanded: boolean) { }
}

@Component({
  selector: 'd2c-triumph-tree',
  templateUrl: './triumph-tree.component.html',
  styleUrls: ['./triumph-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TriumphTreeComponent extends ChildComponent implements OnInit  {
  selectedTreeNodeHash: string;

  triumphTreeControl: FlatTreeControl<any>;
  treeFlattener2: MatTreeFlattener<TriumphNode, TriumphFlatNode>;
  recordDatasource: MatTreeFlatDataSource<any, TriumphFlatNode>;

  constructor(storageService: StorageService,
    public state: PlayerStateService,
    private route: ActivatedRoute, 
    private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
    this.treeFlattener2 = new MatTreeFlattener(this.transformer, this._getLevel, this._isExpandable, this._getChildren);
    this.triumphTreeControl = new FlatTreeControl<TriumphFlatNode>(this._getLevel, this._isExpandable);
  }

  ngOnInit() {
    this.state.player.pipe(
      takeUntil(this.unsubscribe$)).subscribe(p => {
        this.recordDatasource = new MatTreeFlatDataSource(this.triumphTreeControl, this.treeFlattener2);
        this.recordDatasource.data = p.records;
        
      });
      //TODO work this out so it doesn't get double called and also loads properly
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.selectedTreeNodeHash = params['node'];
      if (this.selectedTreeNodeHash != null) {
        for (const n of this.triumphTreeControl.dataNodes) {
          if (n.data.hash === +this.selectedTreeNodeHash) {
            this.triumphTreeControl.expand(n);
            this.expandParents(this.triumphTreeControl, n);
            break;
          }
        }
      }
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

  private _getLevel = (node: TriumphFlatNode) => node.level;

  private _isExpandable = (node: TriumphFlatNode) => node.expandable;

  private _getChildren = (node: any): Observable<any[]> => observableOf(node.children);

  hasChild = (_: number, _nodeData: TriumphFlatNode) => _nodeData.expandable;

  hideNode = (_nodeData: TriumphFlatNode) => this.state.hideCompleteTriumphs && _nodeData.data.complete;


  transformer = (node: TriumphNode, level: number) => {
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
    s = TriumphTreeComponent.replaceAll(s, ',', ' ');
    s = TriumphTreeComponent.replaceAll(s, '"', '');
    s = TriumphTreeComponent.replaceAll(s, '\r\n', 'y');
    s = TriumphTreeComponent.replaceAll(s, '\n', 'x');
    return s;
  }

  public downloadCsvTriumphs() {
    const header = 'Name,Path,Score,Percent,Complete,Redeemed,Description';
    let rows = [];
    for (const t of this.state.currPlayer().searchableTriumphs) {
      let sCsv = TriumphTreeComponent.escape(t.name) + ',';
      let sPath = '';
      for (const e of t.path) {
        sPath = sPath + e.path + ' / ';
      }
      sCsv += TriumphTreeComponent.escape(sPath) + ',';
      sCsv += t.score + ',';
      sCsv += t.percent + ',';
      sCsv += t.complete + ',';
      sCsv += t.redeemed + ',';
      sCsv += TriumphTreeComponent.escape(t.desc);
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
