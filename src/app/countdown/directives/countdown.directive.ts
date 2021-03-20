import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { differenceInSeconds, parseISO } from 'date-fns';
import { Subject } from 'rxjs';
import { switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { Destroyable } from '../../util/destroyable';
import { SecondService } from '../services/second.service';


@Directive({
  selector: '[expDateToSeconds]'
})
export class CountdownDirective extends Destroyable {

  private dateFeed$: Subject<string> = new Subject();

  @Input() set expDateToSeconds(value: string) {
    this.dateFeed$.next(value);
  }
  @Output() newSecondValue = new EventEmitter<number>();

  constructor(private secondService: SecondService) {
    super();

    this.dateFeed$.pipe(
      switchMap((dateString) => {
        let seconds = this.getSecondsUntilDate(dateString);
        this.newSecondValue.emit(seconds);
        return this.secondService.seconds.pipe(
          take(seconds),
          takeUntil(this.destroy$),
          tap(() => this.newSecondValue.emit(--seconds))
        )
      })
    ).subscribe();
  }

  private getSecondsUntilDate(date: string): number {
    const futureInputDate = parseISO(date);
    const now = new Date();
    const seconds = differenceInSeconds(futureInputDate, now);
    return seconds > 0 ? seconds : 1;
  }

}
