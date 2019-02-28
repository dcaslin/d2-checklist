import { Component, OnInit } from '@angular/core';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { Router, ActivatedRoute } from '@angular/router';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { takeUntil } from 'rxjs/operators';
import { UserInfo, Player, FriendListEntry, BungieMember } from '@app/service/model';
import { BungieService } from '@app/service/bungie.service';

@Component({
  selector: 'anms-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss']
})
export class FriendsComponent extends ChildComponent implements OnInit {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;
  members: FriendListEntry[] = [];
  modelPlayer: Player;
  playerCntr: 0;
  allLoaded: boolean;

  constructor(storageService: StorageService, private bungieService: BungieService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
    this.favoriteFeed.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        (x: UserInfo[]) => {
          const members = []
          for (const f of x) {
            members.push({
              user: f,
              player: null,
              errorMsg: null
            });
          }
          this.members = members;
          this.load();
        });
  }

  public async navigateBnetMember(bungieMembershipId: string) {
    const bnetName = await this.bungieService.getFullBNetName(bungieMembershipId);
    if (bnetName!=null) this.router.navigate(['/', 4, bnetName]);        
    return;
  }

  private async loadPlayer(friend: FriendListEntry): Promise<void> {
    const x = await this.bungieService.getChars(friend.user.membershipType, friend.user.membershipId,
      ['Profiles', 'Characters', 'CharacterProgressions'], true);
    if (this.modelPlayer == null && x != null && x.characters != null) {
      this.modelPlayer = x;
    }
    if (x != null && x.characters != null) {
      // in case this is a retry
      friend.errorMsg = null;
      // this will operate directly on x.characters
      // await this.bungieService.updateRaidHistory(x, true);
    } else {
      friend.errorMsg = 'Unable to load player data';
    }
    friend.player = x;
  }

  private async slowlyLoadRest(): Promise<void> {
    if (this.playerCntr >= this.members.length) {
      this.allLoaded = true;
      return;
    }

    try {
      await this.loadPlayer(this.members[this.playerCntr]);
      this.playerCntr++;
      this.slowlyLoadRest();
    } catch (err) {
      console.dir(err);
      // reloading mid load can break this
      if (this.members[this.playerCntr] != null) {
        console.log('Skipping error on ' + this.members[this.playerCntr].user.displayName + ' and continuing');
        this.playerCntr++;
        this.slowlyLoadRest();
      }
    }
  }

  public showAllMilestones(): void {
    this.storageService.showAllMilestones();
  }

  public hideMilestone(ms: string): void {
    this.storageService.hideMilestone(ms);
  }


  public load() {
    this.loading = true;
    this.modelPlayer = null;
    this.playerCntr = 0;
    this.allLoaded = false;
    for (const m of this.members) {
      m.player = null;
      m.errorMsg = null;
    }
    try {
      this.slowlyLoadRest();
    }
    finally {
      this.loading = false;
    }
  }

  ngOnInit() { }

}
