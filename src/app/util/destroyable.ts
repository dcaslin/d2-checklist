import { OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

export class Destroyable implements OnDestroy {

  protected readonly destroy$: Subject<void> = new Subject();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
