import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { IconDefinition } from '@fortawesome/free-brands-svg-icons';
import { BehaviorSubject } from 'rxjs';
import { MilestoneRow, PursuitRow } from '../uber-list-state.service';


export function generateUberState(config: UberToggleConfig, choices: UberChoice[]): UberToggleState {
  const allSelected = choices && choices.every(x => x.checked);
  return {
    config,
    allSelected,
    choices
  };
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-uber-list-toggle',
  templateUrl: './uber-list-toggle.component.html',
  styleUrls: ['./uber-list-toggle.component.scss']
})
export class UberListToggleComponent {
  @Input() state$: BehaviorSubject<UberToggleState>;

  constructor(public iconService: IconService) { }


  selectAll() {
    if (!this.state$?.getValue()?.choices?.length) {
      return;
    }
    const state = this.state$?.getValue();
    const choices = this.state$.getValue().choices.slice(0);
    choices.forEach(x => x.checked = true);
    const newState = generateUberState(state.config, choices);
    this.state$.next(newState);
  }

  exclusiveSelect(choice) {
    if (!this.state$?.getValue()?.choices?.length) {
      return;
    }
    const state = this.state$?.getValue();
    const choices = this.state$.getValue().choices.slice(0);
    choices.forEach(x => x.checked = (x == choice));
    const newState = generateUberState(state.config, choices);
    this.state$.next(newState);
  }

  select(event, choice) {
    event.stopPropagation();
    if (!this.state$?.getValue()?.choices?.length) {
      return;
    }
    const state = this.state$?.getValue();
    choice.checked = !choice.checked;
    const choices = this.state$.getValue().choices.slice(0);
    const newState = generateUberState(state.config, choices);
    this.state$.next(newState);
  }

}

export interface UberToggleConfig {
  title: string;
  debugKey: string;
  icon?: IconDefinition;
  iconClass?: string;
  wildcard?: boolean;
  includeValue(row: MilestoneRow | PursuitRow, state: UberToggleState): boolean;
}

export interface UberToggleState {
  config: UberToggleConfig;
  allSelected: boolean;
  choices: UberChoice[];
}

export class UberChoice {
  // if null, then matches "Other" for list
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly matchValue: any;
  readonly display: string;
  public checked = true;

  constructor(matchValue: any, display: string, checked?: boolean) {
    this.matchValue = matchValue;
    this.display = display;
    if (checked != undefined) { this.checked = checked; }
  }
}
