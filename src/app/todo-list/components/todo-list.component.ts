import { Component, OnInit } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { PlayerStateService } from '../../player/player-state.service';
import {
  Player,
  MilestoneStatus,
  MileStoneName,
  InventoryItem,
  Character,
  NameQuantity,
  SaleItem
} from '@app/service/model';
import { filter } from 'rxjs/operators';
import { from, Observable } from 'rxjs';
import { BungieService } from '@app/service/bungie.service';

// WIP interface to represent a generic todo-list row item (milestone, bounty, etc)
export interface ActivityRow {
  name: string;
  desc: string;
  timeframe: Timeframe;
  resets?: string; // string in parseable date format
  rewards: NameQuantity[];
  charProgress1?: MilestoneStatus;
  charProgress2?: MilestoneStatus;
  charProgress3?: MilestoneStatus;
}

export enum Timeframe {
  weekly = 'Weekly',
  daily = 'Daily'
}

@Component({
  selector: 'd2c-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss']
})
export class TodoListComponent implements OnInit {

  public timeboxedActivities: any[];

  private player: Player;
  private vendorData: SaleItem[];

  constructor(
    public storage: StorageService, // browser storage utils
    public state: PlayerStateService,
    public bungieService: BungieService,
  ) {
  }

  ngOnInit(): void {
    // get all the milestones and bounties that the characters have
    // None of this is working right now, player is not fetched automatically in this route.
    // Will revisit this after I get the boilerplate for the module out of the way
    this.state.player.pipe(filter((p) => !!p)).subscribe((p: Player) => {
      console.log('player received:', p);
      this.player = p;
      this.buildActivityList();
    });
    // get all the available bounties too

  }

  private buildActivityList() {
    this.timeboxedActivities = [
      ...this.buildMilestoneRows(this.player.milestoneList),
      ...this.buildBountyRows(this.player.bounties)
    ];
    console.log('timeboxed activities:', this.timeboxedActivities);
  }

  private buildMilestoneRows(milestones: MileStoneName[]): ActivityRow[] {
    const out = [];
    const [c1, c2, c3] = this.player.characters;
    milestones.forEach(m => {
      out.push({
        name: m.name,
        desc: m.desc,
        timeframe: Timeframe.weekly,
        resets: m.resets,
        rewards: [{ name: m.rewards, quantity: 1 }],
        charProgress1: this.getMilestoneProgress(m, c1),
        charProgress2: this.getMilestoneProgress(m, c2),
        charProgress3: this.getMilestoneProgress(m, c3),
      })
    })
    JSON.parse(JSON.stringify(out)); // deep clone the array
    return out;
  }

  private buildBountyRows(bounties: InventoryItem[]): ActivityRow[] {
    const out = [];
    const [c1, c2, c3] = this.player.characters;
    this.getBountiesForCharacter(c1).subscribe((bounties) => {
      console.log('bounties for character 1', c1.className, bounties);
    })
    bounties.forEach(b => {
      console.log('bounty name:', b.name, b.hash);
      out.push({
        name: b.name,
        desc: b.desc, // this is needed for meaningful bounties
        timeframe: b.typeName === 'Daily Bounty' ? Timeframe.daily : Timeframe.weekly,
        resets: b.expirationDate,
        rewards: b.values,
        charProgress1: this.getBountyProgress(b, c1),
        charProgress2: this.getBountyProgress(b, c2),
        charProgress3: this.getBountyProgress(b, c3),
      })
    })
    JSON.parse(JSON.stringify(out)); // deep clone the array
    return out;
  }

  /**
   * HELPER METHODS FOR MILESTONES
   */

   private getMilestoneProgress(m: MileStoneName, c: Character): MilestoneStatus {
    return !!c ? c.milestones[m.key] : null;
   }

   /**
   * HELPER METHODS FOR BOUNTIES
   */

  private getBountiesForCharacter(c: Character): Observable<any> {
    return from(this.bungieService.loadVendors(c));
  }

  private getBountyProgress(b: InventoryItem, c: Character): MilestoneStatus {
    const owner = b.owner.getValue();
    return !!c ? c.milestones[b.hash] : null;
   }

}

