import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

type Options = 'success' | 'error' | 'info';

export interface Notification {
  mode: Options;
  title: string;
  message: string;

}

@Injectable()
export class NotificationService {
  private notifySub = new Subject();
  public notifyFeed: Observable<Notification>;

  constructor() {
    this.notifyFeed = this.notifySub.asObservable() as Observable<Notification>;
  }

  private notify(note: Notification) {
    this.notifySub.next(note);
  }
  public fail(msg: string): void {
    this.notify({
      mode: 'error',
      title: 'Error',
      message: msg
    });
    return;
  }

  public success(msg: string): void {
    this.notify({
      mode: 'success',
      title: 'Success',
      message: msg
    });
  }

  public info(msg: string): void {
    this.notify({
      mode: 'info',
      title: 'Info',
      message: msg
    });
  }
}
