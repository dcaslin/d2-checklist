import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { BehaviorSubject } from 'rxjs';
import { generateState, ToggleState } from '../gear-filter-state.service';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-gear-toggle',
  templateUrl: './gear-toggle.component.html',
  styleUrls: ['../gear.component.scss']
})
export class GearToggleComponent {

  @Input() state$: BehaviorSubject<ToggleState>;

  constructor(public iconService: IconService) { }

  selectAll() {
    if (!this.state$?.getValue()?.choices?.length) {
      return;
    }
    const state = this.state$?.getValue();
    const choices = this.state$.getValue().choices.slice(0);
    choices.forEach(x => x.value = true);
    const newState = generateState(state.config, choices, state.visibleItemType);
    this.state$.next(newState);
  }

  exclusiveSelect(choice) {
    if (!this.state$?.getValue()?.choices?.length) {
      return;
    }
    const state = this.state$?.getValue();
    const choices = this.state$.getValue().choices.slice(0);
    choices.forEach(x => x.value = (x == choice));
    const newState = generateState(state.config, choices, state.visibleItemType);
    this.state$.next(newState);
  }

  select(event, choice) {
    event.stopPropagation();
    if (!this.state$?.getValue()?.choices?.length) {
      return;
    }
    const state = this.state$?.getValue();
    choice.value = !choice.value;
    const choices = this.state$.getValue().choices.slice(0);
    const newState = generateState(state.config, choices, state.visibleItemType);
    this.state$.next(newState);
  }
}
