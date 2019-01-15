
import { takeUntil } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTabGroup } from '@angular/material';
import { environment as env } from '@env/environment';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { Const, Platform, PublicMilestone, NameDesc } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { BungieService } from '../../service/bungie.service';
import { ChildComponent } from '../../shared/child.component';

@Component({
  selector: 'anms-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;


  @ViewChild(MatTabGroup) tabs: MatTabGroup;

  version = env.versions.app;
  platforms: Platform[];
  selectedPlatform: Platform;
  selectedTab: string;
  gamerTag: string;
  dontSearch: boolean;
  publicMilestones: PublicMilestone[];
  burns: NameDesc[] = [];
  missions: any[] = [];
  flashpoint: string = "";
  showMoreInfo = false;

  constructor(storageService: StorageService, private bungieService: BungieService, private router: Router) {
    super(storageService);
    this.platforms = Const.PLATFORMS_ARRAY;
    this.selectedPlatform = this.platforms[0];


    this.storageService.settingFeed.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        x => {
          if (x.defaultplatform != null) {
            this.setPlatform(x.defaultplatform);
          }
          if (x.defaultgt != null) {
            this.gamerTag = x.defaultgt;
          }
        });

  }

  private setPlatform(type: number) {
    // already set
    if (this.selectedPlatform != null && this.selectedPlatform.type === type) { return; }
    this.selectedPlatform = Const.PLATFORMS_DICT['' + type];
  }

  public routeSearch(): void {
    if (this.selectedPlatform == null) {
      return;
    }
    if (this.gamerTag == null || this.gamerTag.trim().length < 1) {
      return;
    }

    this.router.navigate([this.selectedPlatform.type, this.gamerTag]);
  }

  onPlatformChange() {
    this.storageService.setItem('defaultplatform', this.selectedPlatform.type);
  }

  onGtChange() {
    this.storageService.setItem('defaultgt', this.gamerTag);
  }

  private static getMissionLength(hash: string): number {

    // Combustion 280 [3271773240], 7
    if (hash == "3271773240") {
      return 7;
    }
    // Hope 280[129918239], 6
    else if (hash == "129918239") {
      return 7;
    }
    // Deep Storage 310[1872813880], 6
    else if (hash == "1872813880") {
      return 6;
    }
    // Ice and Shadow 360[2660895412], 5
    else if (hash == "2660895412") {
      return 5;
    }
    // Ace in the Hole 500[2962137994], 15
    else if (hash == "2962137994") {
      return 15;
    }
    // Utopia
    else if (hash == "271962655") {
      return 6;
    }
    // The Gateway
    else if (hash == "1882259272") {
      return 5;
    }
    // Scorned
    else if (hash == "1132291813") {
      return 9;
    }
    // Chosen
    else if (hash == "1906514856") {
      return 9;
    }  // Hijacked
    else if (hash == "4244464899") {
      return 6;
    }  
    // Pilgrimage
    else if (hash == "3008658049") {
      return 7;
    }
    // Riptide 
    else if (hash == "3205547455") {
      return 5;
    }
    // Payback
    else if (hash == "1023966646") {
      return 7;
    }
    // Beyond Infity
    else if (hash == "1259766043") {
      return 11;
    }
    // Nothing Left To Say
    else if (hash == "2146977720") {
      return 13;
    }
    // Unbroken
    else if (hash == "1534123682") {
      return 5;
    }
    // Omega
    else if (hash == "4237009519") {
      return 11;
    }
    // Last Call
    else if (hash == "1513386090") {
      return 15;
    }
    // 1AU
    else if (hash == "589157009") {
      return 12;
    }
    // Looped
    else if (hash == "1313648352") {
      return 6;
    }
    // The Machinist
    else if (hash == "4009655461") {
      return 12;
    }
     // larceny
     else if (hash == "2772894447") {
      return 7;
    }
    // A Deadly Trial
    else if (hash == "4234327344") {
      return 5;
    }
    return 100;
  }

  ngOnInit() {
    this.bungieService.getPublicMilestones().then(ms => {
      this.publicMilestones = ms;
      if (ms != null) {
        for (let m of ms) {
          //daily heroic
          if ("3082135827" === m.hash) {
            const missions = [];
            for (let a of m.aggActivities) {
              let name = a.activity.name;
              name = name.replace("Daily Heroic Story Mission: ", "");
              const time = HomeComponent.getMissionLength(a.activity.hash);

              missions.push({
                name: name,
                hash: a.activity.hash,
                time: time
              });
            }
            missions.sort((a: any, b: any): number => {
              let aV = a.time;
              let bV = b.time;
              if (aV < bV) return -1;
              else if (aV > bV) return 1;
              else return 0;
            });
            this.missions = missions;
          }
          else if ("3172444947" === m.hash) {
            this.burns = m.aggActivities[0].activity.modifiers;
          }
          else if ("463010297" === m.hash) {
            let name = m.summary;
            name = name.replace("FLASHPOINT: ", "");
            this.flashpoint = name;
          }

        }
      }
    });


  }

}
