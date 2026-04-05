import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { BehaviorSubject } from 'rxjs';
import { generateState, ToggleState } from '../gear-filter-state.service';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';


@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-gear-toggle',
    templateUrl: './gear-toggle.component.html',
    styleUrls: ['../gear.component.scss'],
    standalone: true,
    imports: [NgIf, MatButton, MatMenuTrigger, FaIconComponent, MatMenu, MatMenuItem, NgFor, MatIconButton, AsyncPipe]
})
export class GearToggleComponent {

  @Input() state$!: BehaviorSubject<ToggleState>;

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

  exclusiveSelect(choice: any) {
    if (!this.state$?.getValue()?.choices?.length) {
      return;
    }
    const state = this.state$?.getValue();
    const choices = this.state$.getValue().choices.slice(0);
    choices.forEach(x => x.value = (x == choice));
    const newState = generateState(state.config, choices, state.visibleItemType);
    this.state$.next(newState);
  }

  select(event: Event, choice: any) {
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
