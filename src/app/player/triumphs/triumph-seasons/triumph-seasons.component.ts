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

@Component({
  selector: 'd2c-triumph-seasons',
  templateUrl: './triumph-seasons.component.html',
  styleUrls: ['./triumph-seasons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TriumphSeasonsComponent extends ChildComponent implements OnInit {
  public seasonIndex = 0;

  constructor(storageService: StorageService,
    public state: PlayerStateService,
    private route: ActivatedRoute, 
    private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
  }

  ngOnInit() {
  }

}