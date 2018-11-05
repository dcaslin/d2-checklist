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
    this.handlers[this.cookPath(route.routeConfig.path)] = handle;
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return !!route.routeConfig && !!this.handlers[this.cookPath(route.routeConfig.path)];
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
    if (!route.routeConfig) { return null; }
    return this.handlers[this.cookPath(route.routeConfig.path)];
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  private cookPath(origPath: string): string {
    let s: string;
    if (origPath === ':platform/:gt/:tab/:treeHash') {
      s = ':platform/:gt/:tab';
    } else {
      s = origPath;
    }
    return s;
  }

}
