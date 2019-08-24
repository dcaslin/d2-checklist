import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BungieService } from '@app/service/bungie.service';
import { FriendListEntry, Player, UserInfo } from '@app/service/model';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';


@Component({
  selector: 'd2c-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendsComponent extends ChildComponent implements OnInit {
  public members: BehaviorSubject<FriendListEntry[]> = new BehaviorSubject([]);
  modelPlayer: Player;
  playerCntr: 0;

  constructor(storageService: StorageService, private bungieService: BungieService,
    private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService);
    this.favoritesList.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        (x: UserInfo[]) => {
          const members = [];
          for (const f of x) {
            members.push({
              user: f,
              player: null,
              errorMsg: null
            });
          }
          this.members.next(members);
          this.load();
        });
  }

  public async navigateBnetMember(bungieMembershipId: string) {
    const bnetName = await this.bungieService.getFullBNetName(bungieMembershipId);
    if (bnetName != null) { this.router.navigate(['/', 4, bnetName]); }
    return;
  }

  private async loadPlayer(friend: FriendListEntry): Promise<void> {
    const x = await this.bungieService.getChars(friend.user.membershipType, friend.user.membershipId,
      ['Profiles', 'Characters', 'CharacterProgressions', 'Records'], true);
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
    this.ref.markForCheck();
    if (this.playerCntr >= this.members.value.length) {
      return;
    }

    try {
      await this.loadPlayer(this.members.value[this.playerCntr]);
      this.playerCntr++;
      this.slowlyLoadRest();
    } catch (err) {
      console.dir(err);
      // reloading mid load can break this
      if (this.members.value[this.playerCntr] != null) {
        console.log('Skipping error on ' + this.members.value[this.playerCntr].user.displayName + ' and continuing');
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
    this.loading.next(true);
    this.modelPlayer = null;
    this.playerCntr = 0;
    for (const m of this.members.value) {
      m.player = null;
      m.errorMsg = null;
    }
    try {
      this.slowlyLoadRest();
    }
    finally {
      this.loading.next(false);
    }
  }

  ngOnInit() { }

}
