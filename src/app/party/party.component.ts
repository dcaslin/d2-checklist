
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { PlayerComponent } from '@app/player';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../service/bungie.service';
import { Character, DamageType, InventoryItem, ItemType, Player, SearchResult, InventoryPlug } from '../service/model';
import { StorageService } from '../service/storage.service';
import { ChildComponent } from '../shared/child.component';
import { IconService } from '@app/service/icon.service';
import * as moment from 'moment';

@Component({
  selector: 'd2c-party',
  templateUrl: './party.component.html',
  styleUrls: ['./party.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartyComponent extends ChildComponent implements OnInit, OnDestroy {
  public today =  moment(new Date());

  DamageType = DamageType;
  public errorMsg: BehaviorSubject<string> = new BehaviorSubject(null);
  public _player: BehaviorSubject<Player> = new BehaviorSubject(null);
  public _party: BehaviorSubject<PartyPlayer[]> = new BehaviorSubject([]);

  constructor(public bungieService: BungieService,
    public iconService: IconService,
    storageService: StorageService,
    private route: ActivatedRoute, private router: Router,
    public dialog: MatDialog) {
    super(storageService);
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.init(params);
    });
  }

  public async loadPlayer(likelyMembershipType: number, pp: PartyPlayer): Promise<void> {
    try {
      if (pp.errMsg) {
        pp.errMsg = null;
        this._party.next(this._party.getValue());
      }

      const x = await this.bungieService.getCharsTryAllPlatforms(likelyMembershipType, pp.searchResult.membershipId,
        ['Profiles', 'Characters', 'CharacterEquipment', 'CharacterProgressions',
          'CharacterActivities', 'Records', 'ProfileProgression', 'ItemInstances', 'ItemSockets'], true);

      if (x == null || x.characters == null || x.characters.length == 0) {
        console.log('Nothing found');
        pp.errMsg = 'Not found';
      } else {
        pp.errMsg = null;
        pp.player = x;
        if (x.characters != null && x.characters.length > 0) {
          pp.character = x.characters[0];
        }
        const gear = [];

        pp.guns = [];
        const armorMods: InventoryPlug[] = [];
        for (const g of x.gear) {
          if (g.equipped && g.owner.getValue() == pp.character) {
            if (g.type == ItemType.Weapon) {
              pp.guns.push(g);
            } else if (g.type == ItemType.Armor) {
              if (g.tier == 'Exotic') {
                pp.exoticArmor = g;
              }
              for (const m of g.mods) {
                armorMods.push(m);
              }
            } else if (g.type == ItemType.Subclass) {
              pp.subClass = g;
              pp.subClass.power = pp.character.light;
            }
          }
        }
        const mods = this.rollUpMods(armorMods);
        pp.armorMods = mods;
        this._party.next(this._party.getValue());
      }
    } catch (exc) {
      pp.errMsg = '' + exc;
      this._party.next(this._party.getValue());
    }
  }

  private rollUpMods(mods: InventoryPlug[]): PlayerMods[] {
    const map: { [key: string]: InventoryPlug[] } = {};
    for (const m of mods) {
      if (!map[m.hash]) {
        map[m.hash] = [];
      }
      map[m.hash].push(m);
    }
    const returnMe: PlayerMods[] = [];
    for (const key of Object.keys(map)) {
      const val = map[key];
      returnMe.push({
        count: val.length,
        mod: val[0]
      });
    }
    returnMe.sort((a, b) => {
      if (a.count > b.count) {
        return -1;
      }
      if (b.count > a.count) {
        return 1;
      }
      if (a.mod.name > b.mod.name) {
        return 1;
      }
      if (b.mod.name > a.mod.name) {
        return -1;
      }
      return 0;
    });
    return returnMe;
  }

  private async init(params: Params) {
    try {
      this.loading.next(true);
      this.errorMsg.next(null);
      const sPlatform = params['platform'];
      const platform = BungieService.parsePlatform(sPlatform);
      if (platform == null) {
        throw new Error(sPlatform + ' is not a valid platform');
      }
      const sMemberId = params['memberId'];
      const memberId: string = PlayerComponent.validateInteger(sMemberId);
      const x = await this.bungieService.getChars(platform.type, memberId, ['Profiles',
        'Characters', 'CharacterActivities', '1000']);
      this._player.next(x);
      const party: PartyPlayer[] = [];
      if (x.transitoryData != null) {
        console.dir(x);
        for (const p of x.transitoryData.partyMembers) {
          party.push({
            searchResult: p,
            player: null,
            character: null,
            guns: [],
            armorMods: [],
            exoticArmor: null,
            subClass: null,
            errMsg: null
          });
        }
      }

      this._party.next(party);
      for (const p of party) {
        await this.loadPlayer(platform.type, p);
      }
    } catch (exc) {
      console.dir(exc);
      this.errorMsg.next(exc.message);
    } finally {
        this.loading.next(false);
    }
  }
}

interface PartyPlayer {
  searchResult: SearchResult;
  player: Player;
  character: Character;
  guns: InventoryItem[];
  exoticArmor: InventoryItem;
  armorMods: PlayerMods[];
  subClass: InventoryItem;
  errMsg: string;
}

interface PlayerMods {
  count: number;
  mod: InventoryPlug;
}
