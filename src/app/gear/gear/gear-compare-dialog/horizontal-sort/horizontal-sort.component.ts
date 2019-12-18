import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { IconService } from '@app/service/icon.service';

export interface SortEvent {
  field: string;
  descending: boolean;
}

@Component({
  selector: 'd2c-horizontal-sort',
  templateUrl: './horizontal-sort.component.html',
  styleUrls: ['./horizontal-sort.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HorizontalSortComponent {

  @Input() field: string;
  @Input() currVal: string;
  @Input() descending: boolean;
  @Output() sort = new EventEmitter<SortEvent>();

  constructor(public iconService: IconService) { }
  sortClicked() {
    this.sort.emit({
      field: this.field,
      descending: this.field == this.currVal ? !this.descending : true
    });
  }
}
