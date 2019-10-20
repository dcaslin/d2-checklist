
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { PlayerComponent } from '@app/player';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../service/bungie.service';
import { Character, DamageType, InventoryItem, ItemType, Player, SearchResult } from '../service/model';
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
      const x = await this.bungieService.getChars(likelyMembershipType, pp.searchResult.membershipId,
        ['Profiles', 'Characters', 'CharacterEquipment', 'CharacterProgressions',
          'CharacterActivities', 'Records', 'ProfileProgression', 'ItemInstances'], true, true);

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
        for (const g of x.gear) {
          if (g.equipped && g.owner == pp.character) {
            if (g.type == ItemType.Weapon) {
              pp.guns.push(g);
            } else if (g.type == ItemType.Armor) {
              if (g.tier == 'Exotic') {
                pp.exoticArmor = g;
              }
            } else if (g.type == ItemType.Subclass) {
              pp.subClass = g;
              pp.subClass.power = pp.character.light;
            }
          }
        }
        this._party.next(this._party.getValue());
      }
    } catch (exc) {
      pp.errMsg = '' + exc;
      this._party.next(this._party.getValue());
    }
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
        for (const p of x.transitoryData.partyMembers) {
          party.push({
            searchResult: p,
            player: null,
            character: null,
            guns: [],
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
  subClass: InventoryItem;
  errMsg: string;
}
