import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { ItemType } from '@app/service/model';

@Component({
  selector: 'anms-gear-toggle',
  templateUrl: './gear-toggle.component.html',
  styleUrls: ['./gear.component.scss']
})
export class GearToggleComponent implements OnInit {

  @Input()
  set currentItemType(currentItemType: ItemType) {
    this.updateCurrentItemType(currentItemType);
  }
  _currentItemType: ItemType;
  hidden: boolean;
  isAllSelected = true;

  @Input()
  displayOptions: ItemType[];

  @Input()
  choices: Choice[];

  @Input()
  iconClass: string;

  @Input()
  title: string;

  @Output() change = new EventEmitter<ToggleInfo>();

  public setCurrentItemType(currentItemType: ItemType) {
    this.updateCurrentItemType(currentItemType, true);
  }

  private updateCurrentItemType(currentItemType: ItemType, noEmit?: boolean) {
    if (currentItemType !== this._currentItemType) {
      this._currentItemType = currentItemType;
      this.checkDisplay(noEmit);
    }
  }



  ngOnInit() {
    this.checkDisplay();
  }

  private emit() {
    this.setAllSelected();
    this.change.emit({
      title: this.title,
      hidden: this.hidden,
      choices: this.choices
    });
  }

  private checkDisplay(noEmit?: boolean) {
    if (this.displayOptions != null && this.displayOptions.length > 0) {
      if (this.displayOptions.indexOf(this._currentItemType) >= 0) {
        this.hidden = false;
      } else {
        this.hidden = true;
      }
      if (noEmit != true) {
        this.emit();
      }
    }
  }

  setAllSelected() {
    for (const ch of this.choices) {
      if (!ch.value) {
          this.isAllSelected = false;
         return ;
      }
    }
    this.isAllSelected = true;
  }

  selectAll(noEmit?: boolean) {
    try {
      for (const ch of this.choices) {
        ch.value = true;
      }
      if (!noEmit) {
        this.emit();
      } else {
        this.setAllSelected();
      }
    } catch (e) {
      console.log('Error selectAll: ' + e);
    }
  }

  exclusiveSelect(choice) {
    try {
      for (const ch of this.choices) {
        if (ch !== choice) {
          ch.value = false;
        }
      }
      choice.value = true;
      this.emit();
    } catch (e) {
      console.log('Error exclusiveSelect: ' + e);
    }
  }

  select(event, choice) {
    try {
      choice.value = !choice.value;
      this.emit();
      event.stopPropagation();
    } catch (e) {
      console.log('Error select: ' + e);
    }
  }

  public isChosen(optionType: ItemType, val: any): boolean {
    if (this.hidden == true) { return true; }
    if (this.isAllSelected) { return true; }
    if (optionType != this._currentItemType) {
      console.log('OOPS');
    }

    if (this.choices.length == null || this.choices.length == 0) { return true; }
    for (const c of this.choices) {
      if (c.value == true && c.matchValue == val) { return true; }
    }
    return false;
  }

  public getNotes(): string {
    if (this.hidden == true) { return null; }
    if (this.choices.length == null || this.choices.length == 0) { return null; }
    if (this.isAllSelected) { return null; }
    let s = this.title + ': \n';
    for (const c of this.choices) {
      if (c.value == false) {
        s += '    ' + c.display + '\n';
      }
    }
    return s;
  }
}

export interface ToggleInfo {
  title: string;
  hidden: boolean;
  choices: Choice[];
}

export class Choice {
  readonly matchValue: string;
  readonly display: string;
  public value = true;

  constructor(matchValue: string, display: string, value?: boolean) {
    this.matchValue = matchValue;
    this.display = display;
    if (value != undefined) { this.value = value; }
  }
}
