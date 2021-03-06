import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BungieService } from '@app/service/bungie.service';
import { IconService } from '@app/service/icon.service';
import { FriendListEntry, Player, UserInfo } from '@app/service/model';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss']
})
export class FriendsComponent extends ChildComponent implements OnInit {
  public today =  moment(new Date());
  public members: BehaviorSubject<FriendListEntry[]> = new BehaviorSubject([]);
  modelPlayer: Player;
  playerCntr: 0;

  constructor(storageService: StorageService, private bungieService: BungieService, public iconService: IconService,
    private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService);
    this.favoritesList$.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        (x: UserInfo[]) => {
          const members: FriendListEntry[] = [];
          for (const f of x) {
            const member = new FriendListEntry();
            member.user = f;
            members.push(member);
          }
          this.members.next(members);
          this.load();
        });
  }

  public  async loadPlayer(friend: FriendListEntry): Promise<void> {
    const x = await this.bungieService.getChars(friend.user.membershipType, friend.user.membershipId,
      ['Profiles', 'Characters', 'CharacterProgressions', 'ProfileProgression', 'ItemObjectives',
      'CharacterEquipment', 'ItemInstances', 'CharacterInventories', 'ProfileInventories',
      'CharacterActivities', 'Records', 'Collectibles', 'PresentationNodes'
    ], true, true);
    if (this.modelPlayer == null && x != null && x.characters != null) {
      this.modelPlayer = x;
    }
    friend.player$.next(x);
    if (x != null && x.characters != null) {
      // in case this is a retry
      friend.errorMsg$.next(null);
      // this will operate directly on x.characters
      this.bungieService.loadActivityPseudoMilestones(friend.player$);
      // await this.bungieService.updateRaidHistory(x, true);
    } else {
      friend.errorMsg$.next('Unable to load player data');
    }
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
      m.player$.next(null);
      m.errorMsg$.next(null);
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
