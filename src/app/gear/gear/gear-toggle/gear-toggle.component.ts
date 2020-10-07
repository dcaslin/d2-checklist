import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { InventoryItem, ItemType } from '@app/service/model';
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

  @Output() change = new EventEmitter<void>();


  @Input() state: ToggleState;
  @Output() stateChange = new EventEmitter<ToggleState>();

  public static cloneState(val: ToggleState): ToggleState {
    return GearToggleComponent.generateState(val.config, val.choices, val.visibleItemType);
  }

  public static generateState(config: ToggleConfig, choices: Choice[], visibleItemType: ItemType): ToggleState {
    const hidden = true === (config.displayTabs?.indexOf(visibleItemType) < 0);
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

  public static selectAllState(state: ToggleState) {
    if (state?.choices) {
      for (const ch of state.choices) {
        ch.value = true;
      }
    }
  }

  selectAll() {
    try {
      GearToggleComponent.selectAllState(this.state);
      this.state = GearToggleComponent.generateState(this.state.config, this.state.choices, this.state.visibleItemType);

      this.stateChange.emit(this.state);
      this.change.emit();
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
      this.stateChange.emit(this.state);
      this.change.emit();
    } catch (e) {
      console.log('Error exclusiveSelect: ' + e);
    }
  }

  select(event, choice) {
    try {
      choice.value = !choice.value;
      this.state = GearToggleComponent.generateState(this.state.config, this.state.choices, this.state.visibleItemType);
      event.stopPropagation();
      this.stateChange.emit(this.state);
      this.change.emit();
    } catch (e) {
      console.log('Error select: ' + e);
    }
  }

  public static getNote(state: ToggleState) {
    let returnMe = `${state.config.title}: `;
    if (state.hidden == true) {
        returnMe = returnMe + ' hidden';
    } else if (state.choices.length == null || state.choices.length == 0) {
      returnMe = returnMe + ' empty choices';
    } else if (state.allSelected) {
      returnMe = returnMe + 'all selected';
    } else {
      returnMe = returnMe + '\n';
      for (const c of state.choices) {
        if (c.value == false) {
          returnMe = '    ' + c.display + '\n';
        }
      }
    }
    return returnMe;
  }

}

export class Choice {
  readonly matchValue: any;
  readonly display: string;
  public value = true;

  constructor(matchValue: any, display: string, value?: boolean) {
    this.matchValue = matchValue;
    this.display = display;
    if (value != undefined) { this.value = value; }
  }
}

export interface ToggleConfig {
  title: string;
  debugKey: string;
  icon?: IconDefinition;
  iconClass?: string;
  displayTabs: ItemType[];
  grabValue(i: InventoryItem): any;
}

export interface ToggleState {
  config: ToggleConfig;
  visibleItemType: ItemType;
  hidden: boolean;
  allSelected: boolean;
  choices: Choice[];
}

