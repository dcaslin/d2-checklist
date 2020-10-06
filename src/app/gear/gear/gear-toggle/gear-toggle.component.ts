import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { ItemType } from '@app/service/model';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { IconService } from '@app/service/icon.service';
import { BehaviorSubject, generate } from 'rxjs';

@Component({
  selector: 'd2c-gear-toggle',
  templateUrl: './gear-toggle.component.html',
  styleUrls: ['../gear.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GearToggleComponent implements OnInit {

  _state: ToggleState;
  @Output() change = new EventEmitter<ToggleState>();

  @Input()
  get state() {
    return this._state;
  }

  set state(val: ToggleState) {
    this._state = val;
    this.change.emit(this._state);
  }

  public static cloneState(val: ToggleState): ToggleState {
    return GearToggleComponent.generateState(val.config, val.choices, val.visibleItemType);
  }

  public static generateState(config: ToggleConfig, choices: Choice[], visibleItemType: ItemType): ToggleState {
    const hidden = config.displayTabs && config.displayTabs.indexOf(visibleItemType) >= 0;
    const allSelected = choices && choices.every(x => x.value);
    return {
      config,
      visibleItemType,
      hidden,
      allSelected,
      choices
    };
  }


  constructor(public iconService: IconService) { }

  ngOnInit() {

  }

  selectAll() {
    try {
      if (this.state?.choices) {
        for (const ch of this.state.choices) {
          ch.value = true;
        }
      }
      this.state = GearToggleComponent.generateState(this.state.config, this.state.choices, this.state.visibleItemType);
    } catch (e) {
      console.log('Error selectAll: ' + e);
    }
  }

  exclusiveSelect(choice) {
    try {
      for (const ch of this.state.choices) {
        if (ch !== choice) {
          ch.value = false;
        }
      }
      choice.value = true;
      this.state = GearToggleComponent.generateState(this.state.config, this.state.choices, this.state.visibleItemType);
    } catch (e) {
      console.log('Error exclusiveSelect: ' + e);
    }
  }

  select(event, choice) {
    try {
      choice.value = !choice.value;
      this.state = GearToggleComponent.generateState(this.state.config, this.state.choices, this.state.visibleItemType);
      event.stopPropagation();
    } catch (e) {
      console.log('Error select: ' + e);
    }
  }

  // public isChosen(optionType: ItemType, val: any): boolean {
  //   if (this.hidden == true) { return true; }
  //   if (this.isAllSelected$.getValue()) { return true; }
  //   if (optionType != this._currentItemType) {
  //     console.log('OOPS');
  //   }

  //   if (this._choices.length == null || this._choices.length == 0) { return true; }
  //   for (const c of this._choices) {
  //     if (c.value == true && c.matchValue == val) { return true; }
  //   }
  //   return false;
  // }

  // public getNotes(): string {
  //   if (this.hidden == true) { return this.title + ': hidden'; }
  //   if (this._choices.length == null || this._choices.length == 0) { return this.title + ': empty choices'; }
  //   if (this.isAllSelected$.getValue()) { return this.title + ': all selected'; }
  //   let s = this.title + ': \n';
  //   for (const c of this._choices) {
  //     if (c.value == false) {
  //       s += '    ' + c.display + '\n';
  //     }
  //   }
  //   return s;
  // }

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

export interface ToggleConfig {
  title: string;
  icon?: IconDefinition;
  iconClass?: string;
  displayTabs: ItemType[];
}

export interface ToggleState {
  config: ToggleConfig;
  visibleItemType: ItemType;
  hidden: boolean;
  allSelected: boolean;
  choices: Choice[];
}

