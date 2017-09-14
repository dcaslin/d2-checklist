import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from "../../service/bungie.service";
import { BungieMember, BungieMembership, BungieMemberPlatform, SearchResult, Player, BungieGroupMember, ClanInfo } from "../../service/model";
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';

@Component({
  selector: 'clan-history',
  templateUrl: './clan.component.html',
  styleUrls: ['./clan.component.scss']
})
export class ClanComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;
  
  id: string;
  info: ClanInfo;
  members: BungieGroupMember[] = [];

  constructor(storageService: StorageService, private bungieService: BungieService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
  }
  
  private load(){
    this.loading = true;

    this.bungieService.getClanInfo(this.id).then(i=>{
      this.info = i;
      if (i!=null){
        this.bungieService.getClanMembers(this.id).then(x=>{
          this.members = x;
          this.loading = false;
        });
      }
      else{
        this.loading = false;
      }
        
    }).catch((x) => {
      this.loading = false;
    });
  }

  private sub: any;
  ngOnInit() {
    this.sub = this.route.params.takeUntil(this.unsubscribe$).subscribe(params => {
      this.id = params['id'];
      if (this.id!= null) {
        this.load();
      }
    });
  }
}
