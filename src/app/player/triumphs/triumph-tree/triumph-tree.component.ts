import { FlatTreeControl } from '@angular/cdk/tree';
import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { ActivatedRoute } from '@angular/router';
import { CollectionTreeComponent, TriumphFlatNode } from '@app/player/collections/collection-tree/collection-tree.component';
import { TriumphNode } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { Observable, of as observableOf } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlayerStateService } from '../../player-state.service';
import { IconService } from '@app/service/icon.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-triumph-tree',
  templateUrl: './triumph-tree.component.html',
  styleUrls: ['./triumph-tree.component.scss']
})
export class TriumphTreeComponent extends ChildComponent implements OnInit {
  selectedTreeNodeHash: string;
  triumphTreeControl: FlatTreeControl<any>;
  treeFlattener2: MatTreeFlattener<TriumphNode, TriumphFlatNode>;
  recordDatasource: MatTreeFlatDataSource<any, TriumphFlatNode>;

  constructor(storageService: StorageService,
    public iconService: IconService,
    public state: PlayerStateService,
    public location: Location,
    private route: ActivatedRoute) {
    super(storageService);
    this.treeFlattener2 = new MatTreeFlattener(this.transformer, this._getLevel, this._isExpandable, this._getChildren);
    this.triumphTreeControl = new FlatTreeControl<TriumphFlatNode>(this._getLevel, this._isExpandable);
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.selectedTreeNodeHash = params['node'];
    });

    this.state.player.pipe(
      takeUntil(this.unsubscribe$)).subscribe(p => {
        this.recordDatasource = new MatTreeFlatDataSource(this.triumphTreeControl, this.treeFlattener2);
        this.recordDatasource.data = p.records;
        CollectionTreeComponent.expandToSelected(this.selectedTreeNodeHash, this.triumphTreeControl);
      });

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

  public sumTriumphs() {
    let sum = 0;
    for (const t of this.state.currPlayer().searchableTriumphs) {
      if (t.redeemed) {
        sum += t.score;
      } else if (t.interval) {
        for (const i of t.objectives) {
          if (i.complete) {
            sum += i.score;
          }
        }
      }
    }

    const score = this.state.currPlayer().triumphScore;
    const diff = sum - score;

    alert('Summed score: ' + sum + '.\nReported score: ' + score + '.\n Difference: ' + diff);


  }

  public downloadCsvTriumphs() {
    const header = 'Name,Path,Sunset,Earned Pts, Total Pts,Percent,Complete,Redeemed,Description';
    let rows = [];
    for (const t of this.state.currPlayer().searchableTriumphs) {
      let sCsv = TriumphTreeComponent.escape(t.name) + ',';
      let sPath = '';
      for (const e of t.path) {
        sPath = sPath + e.path + ' / ';
      }
      sCsv += TriumphTreeComponent.escape(sPath) + ',';
      sCsv += t.contentVault == true ? 'true,' : 'false,';
      sCsv += t.earned + ',';
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
