
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { ArmorPerksDialogComponent, PlayerMods } from '@app/gear/gear/armor-perks-dialog/armor-perks-dialog.component';
import { PlayerComponent } from '@app/player';
import { IconService } from '@app/service/icon.service';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../service/bungie.service';
import { Character, DamageType, InventoryItem, ItemType, Player, SearchResult } from '../service/model';
import { ChildComponent } from '../shared/child.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIf, NgFor, NgTemplateOutlet, AsyncPipe, DecimalPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatAnchor } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { AgoHumanizedPipe } from '../shared/pipe/timing.pipe';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-party',
    templateUrl: './party.component.html',
    styleUrls: ['./party.component.scss'],
    standalone: true,
    imports: [NgIf, MatProgressSpinner, RouterLink, NgFor, FaIconComponent, MatAnchor, NgTemplateOutlet, MatTooltip, AsyncPipe, DecimalPipe, AgoHumanizedPipe]
})
export class PartyComponent extends ChildComponent implements OnInit {
  DamageType = DamageType;
  public errorMsg: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public _player: BehaviorSubject<Player | null> = new BehaviorSubject<Player | null>(null);
  public _party: BehaviorSubject<PartyPlayer[]> = new BehaviorSubject<PartyPlayer[]>([]);

  constructor(public bungieService: BungieService,
    public iconService: IconService,
    private route: ActivatedRoute, private router: Router,
    public dialog: MatDialog) {
    super();
  }

  ngOnInit() {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.init(params);
    });
  }


  public async loadPlayer(likelyMembershipType: number, pp: PartyPlayer): Promise<void> {
    try {
      if (pp.errMsg) {
        pp.errMsg = null!;
        this._party.next(this._party.getValue());
      }

      const x = await this.bungieService.getCharsTryAllPlatforms(likelyMembershipType, pp.searchResult.membershipId,
        ['Profiles', 'Characters', 'CharacterEquipment', 'CharacterProgressions',
          'CharacterActivities', 'Records', 'ProfileProgression', 'ItemInstances', 'ItemSockets'], true);

      if (x == null || x.characters == null || x.characters.length == 0) {
        console.log('Nothing found');
        pp.errMsg = 'Not found';
      } else {
        pp.errMsg = null!;
        pp.player = x;
        if (x.characters != null && x.characters.length > 0) {
          pp.character = x.characters[0];
        }
        pp.guns = [];
        for (const g of x.gear) {
          if (g.equipped.getValue() && g.owner.getValue().id == pp.character.id) {
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
        const mods = ArmorPerksDialogComponent.getEquippedPerks(x, pp.character);
        pp.armorMods = mods;
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
            player: null!,
            character: null!,
            guns: [],
            armorMods: [],
            exoticArmor: null!,
            subClass: null!,
            errMsg: null!
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