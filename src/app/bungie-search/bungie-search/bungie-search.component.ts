import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from "../../service/bungie.service";
import { BungieMember, BungieMembership, BungieMemberPlatform, SearchResult, Player } from "../../service/model";
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';

@Component({
  selector: 'bungie-search-history',
  templateUrl: './bungie-search.component.html',
  styleUrls: ['./bungie-search.component.scss']
})
export class BungieSearchComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  name: string;
  accounts: BungieMember[] = null;

  constructor(storageService: StorageService, private bungieService: BungieService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
  }

  private loadPlayer(a: BungieMemberPlatform) {
    this.loading = true;
    this.bungieService.searchPlayer(a.platform.type, a.name).then((p: SearchResult) => {
      if (p != null) {

        this.bungieService.getChars(p).then((x: Player) => {
          this.loading = false;
          if (x!=null)
            this.router.navigate([a.platform.type, a.name]);
          else
            a.defunct = true;
        });

      }
      else {
        a.defunct = true;
        this.loading = false;
      }
    });
  }

  private loadClan(member: BungieMember){
    
    this.bungieService.getClanId(member.id).then((x: string)=>{
      if (x==null){
        member.noClan = true;
      }
      else{
        this.router.navigate(["clan", x]);
      }

    });
  }

  search() {
    if (this.name!=null){
      this.router.navigate(["search", this.name]);
    }
   
  }

  private load(){
    this.loading = true;
    this.bungieService.searchBungieUsers(this.name)
      .then((x: BungieMember[]) => {
        console.dir(x);
        this.accounts = x;
        this.loading = false;
      })
      .catch((x) => {
        this.loading = false;
      });
  }

  private sub: any;
  ngOnInit() {
    this.sub = this.route.params.takeUntil(this.unsubscribe$).subscribe(params => {
      this.name = params['name'];
      if (this.name != null) {
        this.load();
      }
    });
  }
}
