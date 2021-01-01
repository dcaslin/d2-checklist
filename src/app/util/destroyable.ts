import { Directive, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Directive()
// tslint:disable-next-line: directive-class-suffix
export abstract class Destroyable implements OnDestroy {

  protected readonly destroy$: Subject<void> = new Subject();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
