/**
 * Created by davecaslin on 1/5/17.
 */


import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot } from '@angular/router';

export class StickyReuseStrategy implements RouteReuseStrategy {

  handlers: {[key: string]: DetachedRouteHandle} = {};

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return true;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    this.handlers[this.cookPath(route)] = handle;
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return !!route.routeConfig && !!this.handlers[this.cookPath(route)];
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
    if (!route.routeConfig) { return null; }
    return this.handlers[this.cookPath(route)];
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    const val = this.cookPath(future) === this.cookPath(curr);
    return val;
  }

  private cookPath(route: ActivatedRouteSnapshot): string {
    if (route == null || route.routeConfig == null || route.routeConfig.path == null) { return null; }
    const origPath = route.routeConfig.path;
    let s: string;
    if (origPath === ':platform/:gt/:tab/:treeHash') {
      s = ':platform/:gt/:tab';
    } else {
      s = origPath;
    }
    return s;
  }

}
