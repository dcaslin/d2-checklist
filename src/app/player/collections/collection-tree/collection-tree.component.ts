import { FlatTreeControl } from '@angular/cdk/tree';
import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { ActivatedRoute } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { TriumphNode } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { Observable, of as observableOf } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { PlayerStateService } from '../../player-state.service';


export class TriumphFlatNode {
  constructor(
    public expandable: boolean, public level: number, public data: TriumphNode, public expanded: boolean) { }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-collection-tree',
  templateUrl: './collection-tree.component.html',
  styleUrls: ['./collection-tree.component.scss']
})
export class CollectionTreeComponent extends ChildComponent implements OnInit {
  selectedTreeNodeHash: string;
  collectionDatasource: MatTreeFlatDataSource<any, TriumphFlatNode>;
  collectionTreeControl: FlatTreeControl<any>;
  treeFlattener2: MatTreeFlattener<TriumphNode, TriumphFlatNode>;

  constructor(storageService: StorageService,
    public iconService: IconService,
    public state: PlayerStateService,
    public location: Location,
    private route: ActivatedRoute) {
    super(storageService);
    this.collectionTreeControl = new FlatTreeControl<TriumphFlatNode>(this._getLevel, this._isExpandable);
    this.treeFlattener2 = new MatTreeFlattener(this.transformer2, this._getLevel, this._isExpandable, this._getChildren);
  }
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.selectedTreeNodeHash = params['node'];
    });
    this.state.player.pipe(first()).subscribe(p => {
      this.collectionDatasource = new MatTreeFlatDataSource(this.collectionTreeControl, this.treeFlattener2);
      this.collectionDatasource.data = p.collections;
      CollectionTreeComponent.expandToSelected(this.selectedTreeNodeHash, this.collectionTreeControl);
    });
  }


  public static expandToSelected(selectedTreeNodeHash: string, treeControl: FlatTreeControl<any>) {
    if (selectedTreeNodeHash != null) {
      for (const n of treeControl.dataNodes) {
        if (n.data.hash === +selectedTreeNodeHash) {
          treeControl.expand(n);
          CollectionTreeComponent.expandParents(treeControl, n);
          // wait for view to catch up then try to scroll
          setTimeout(() => {
            const id = 'tree-node-' + n.data.hash;
            const el = document.getElementById(id);
            if (el != null) {
              el.scrollIntoView();
            } else {
              console.log('Tree node id=' + id + ' not found, cannot scroll to it');
            }
          }, 100);

          break;
        }
      }
    }
  }


  public static getParentNode(tree: FlatTreeControl<any>, node: TriumphFlatNode): TriumphFlatNode {
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

  public static expandParents(tree: FlatTreeControl<any>, node: TriumphFlatNode): void {
    const parent = CollectionTreeComponent.getParentNode(tree, node);
    tree.expand(parent);
    if (parent && parent.level > 0) {
      CollectionTreeComponent.expandParents(tree, parent);
    }
  }

  transformer2 = (node: TriumphNode, level: number) => {
    return new TriumphFlatNode(!!node.children, level, node, true);
  }

  private _getLevel = (node: TriumphFlatNode) => node.level;
  private _isExpandable = (node: TriumphFlatNode) => node.expandable;
  private _getChildren = (node: any): Observable<any[]> => observableOf(node.children);
  hasChild = (_: number, _nodeData: TriumphFlatNode) => _nodeData.expandable;
  hideNode = (_nodeData: TriumphFlatNode) => this.state.hideCompleteCollectibles && _nodeData.data.complete;

}
