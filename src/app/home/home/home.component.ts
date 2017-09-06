import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import { ANIMATE_ON_ROUTE_ENTER } from '@app/core';
import { BungieService, Platform} from "../../service/bungie.service";

@Component({
  selector: 'anms-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  private unsubscribe$: Subject<void> = new Subject<void>();

  platforms: Platform[];
  selectedPlatform: Platform;
  gamerTag: string;

  constructor(private bungieService: BungieService, private store: Store<any>) {
    this.platforms = bungieService.getPlatforms();
    this.selectedPlatform = this.platforms[0];
  }

  public searchPlayer(): void{
    if (this.selectedPlatform==null){
      console.log("1");
       return;}
    if (this.gamerTag==null || this.gamerTag.trim().length<1){
      console.log("2");
       return;}
    this.bungieService.searchPlayer(this.selectedPlatform.type, this.gamerTag);
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
