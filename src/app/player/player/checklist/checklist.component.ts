import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { Player } from '@app/service/model';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'anms-checklist',
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.scss']
})
export class ChecklistComponent extends ChildComponent implements OnInit {

  @Input() player: Player;
  @Input() parentLoading: BehaviorSubject<boolean>;
  @Input() selectedTab: string;
  @Output() refreshPlayer = new EventEmitter<void>();

  hideComplete: boolean;

  constructor(
    storageService: StorageService,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
    this.hideComplete = localStorage.getItem('hide-completed-checklists') === 'true';

  }

  ngOnInit() {
  }

  public hideCompleteChange() {
    localStorage.setItem('hide-completed-checklists', '' + this.hideComplete);
  }



}
