/**
 * Created by davecaslin on 1/5/17.
 */


import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot } from '@angular/router';

export class StickyReuseStrategy implements RouteReuseStrategy {

  handlers: {[key: string]: DetachedRouteHandle} = {};

  getPath(route: ActivatedRouteSnapshot){
    if (route==null) return "null";
    if (route.routeConfig==null) return "null routeConfig";
    if (route.routeConfig.path==null) return "null routeConfig.path";
    return route.routeConfig.path;
  }

  getPrefix(route: ActivatedRouteSnapshot){
    if (route==null) return null;
    if (route.routeConfig==null) return null;
    if (route.routeConfig.path==null) return null;
    const p = route.routeConfig.path;
    const i = p.indexOf("/");
    //const i = p.lastIndexOf("/");
    if (i>0){
      return p.substring(0, i);
    }
    else{
      return p;
    }
  }

  //Variable child routes are horrible for caching, we only use those for vendors and leaderboards
  //There's little benefit to caching there anyway
  dontSave(route: ActivatedRouteSnapshot):boolean{
    const prefix = this.getPrefix(route);
    if (prefix=="vendors" || prefix=="leadboard") return true;
    return false;
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return !this.dontSave(route);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    this.handlers[this.getPrefix(route)] = handle;
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    if (this.dontSave(route)) return false;
    const prefix = this.getPrefix(route);
    return !!prefix && !!this.handlers[prefix];
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
    let returnMe = null;
    const prefix = this.getPrefix(route);
    if (prefix!=null && this.handlers[prefix]!=null) {
      returnMe = this.handlers[prefix];
    }
    console.log("*    retrieving route: "+route.routeConfig.path+": "+(returnMe!=null));
    return returnMe;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    const should = this.getPrefix(future) === this.getPrefix(curr);
    if (should){
      console.log("Reuse: "+this.getPath(curr)+"->"+this.getPath(future));
    }
    return should;
  }

}
