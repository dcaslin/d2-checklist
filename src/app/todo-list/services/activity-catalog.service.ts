import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * The service that drives the todo-list page.
 * The rows shown in the todo table will ultimately be drawn from this service.
 */
@Injectable()
export class ActivityCatalogService {

  // TODO: define a model for the rows to follow
  public ActivityRows: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor() { }

}
