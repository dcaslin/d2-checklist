import { Injectable } from '@angular/core';
import { fromUnixTime } from 'date-fns';
import { BungieGroupMember, BungieMember, BungieMemberPlatform, BungieMembership, Const, UserInfo } from './model';

@Injectable({
  providedIn: 'root'
})
export class SimpleParseService {

  public static parseClanMembers(members: any[]): BungieGroupMember[] {
    if (members == null) { return []; }
    const returnMe: BungieGroupMember[] = [];
    members.forEach(x => {
        const b: BungieGroupMember = new BungieGroupMember();
        b.groupId = x.groupId;
        b.lastOnlineStatusChange = fromUnixTime(x.lastOnlineStatusChange).toISOString();
        b.isOnline = x.isOnline;
        b.memberType = x.memberType;
        b.destinyUserInfo = SimpleParseService.parseUserInfo(x.destinyUserInfo);
        b.bungieNetUserInfo = x.bungieNetUserInfo;
        b.joinDate = x.joinDate;
        returnMe.push(b);
    });

    returnMe.sort((a, b) => {
        if (a.lastOnlineStatusChange < b.lastOnlineStatusChange) {
            return 1;
        } else if (a.lastOnlineStatusChange > b.lastOnlineStatusChange) {
            return -1;
        }
        return 0;
    });
    return returnMe;
}



  public static parseBungieMember(r: PrivBungieMember): BungieMember {
    if (r.isDeleted === true) { return; }
    let xbl: BungieMemberPlatform;
    let psn: BungieMemberPlatform;
    let bnet: BungieMemberPlatform;
    let steam: BungieMemberPlatform;
    let epic: BungieMemberPlatform;
    if (r.xboxDisplayName != null) {
        xbl = new BungieMemberPlatform(r.xboxDisplayName, Const.XBL_PLATFORM);
    }
    if (r.psnDisplayName != null) {
        psn = new BungieMemberPlatform(r.psnDisplayName, Const.PSN_PLATFORM);
    }
    if (r.blizzardDisplayName != null) {

        bnet = new BungieMemberPlatform(r.blizzardDisplayName, Const.BNET_PLATFORM);
    }
    if (r.egsDisplayName != null) {
        epic = new BungieMemberPlatform(r.egsDisplayName, Const.EPIC_PLATFORM);
    }
    if (r.steamDisplayName != null) {
        steam = new BungieMemberPlatform(r.steamDisplayName, Const.STEAM_PLATFORM);
    }
    if (xbl == null && psn == null && bnet == null && steam == null && epic == null) { return null; }
    return new BungieMember(r.displayName, r.membershipId, xbl, psn, bnet, steam, epic);

}

public static parseBungieMembers(results: PrivBungieMember[]): BungieMember[] {
    if (results == null) { return null; }
    const returnMe: BungieMember[] = [];
    results.forEach(r => {
        const mem = this.parseBungieMember(r);
        if (mem != null) {
            returnMe.push(mem);
        }

    });
    return returnMe;
}
  
  public static parseLinkedProfiles(resp: any) {
    if (resp.bnetMembership == null) {
        return null;
    }
    const returnMe: BungieMembership = new BungieMembership();
    returnMe.bungieId = resp.bnetMembership.membershipId;
    const aUser: UserInfo[] = [];
    for (const u of resp.profiles) {
        aUser.push(SimpleParseService.parseUserProfile(u, resp.bnetMembership.iconPath));
    }
    returnMe.destinyMemberships = aUser;
    return returnMe;

}



  public static parseUserProfile(i: any, iconPath: string): UserInfo {
    let platformName = '';
    if (i.membershipType === 1) {
      platformName = 'XBL';
    } else if (i.membershipType === 2) {
      platformName = 'PSN';
    } else if (i.membershipType === 4) {
      platformName = 'BNET';
    }
    return {
      membershipType: i.membershipType,
      membershipId: i.membershipId,
      crossSaveOverride: i.crossSaveOverride,
      displayName: i.displayName,
      icon: iconPath,
      platformName: platformName
    };
  }

  public static parseUserInfo(i: any): UserInfo {
    let platformName = '';
    if (i.membershipType === 1) {
      platformName = 'XBL';
    } else if (i.membershipType === 2) {
      platformName = 'PSN';
    } else if (i.membershipType === 4) {
      platformName = 'BNET';
    }
    return {
      membershipType: i.membershipType,
      membershipId: i.membershipId,
      crossSaveOverride: i.crossSaveOverride,
      displayName: i.displayName,
      icon: i.iconPath,
      platformName: platformName
    };

  }

  public static lookupMode(mode: number): string {
    if (mode === 0) { return 'None'; }
    if (mode === 2) { return 'Story'; }
    if (mode === 3) { return 'Strike'; }
    if (mode === 4) { return 'Raid'; }
    if (mode === 5) { return 'All PvP'; }
    if (mode === 6) { return 'Patrol'; }
    if (mode === 7) { return 'All PvE'; }
    if (mode === 9) { return 'Reserved9'; }
    if (mode === 10) { return 'Control'; }
    if (mode === 11) { return 'Reserved11'; }
    if (mode === 12) { return 'Clash'; }
    if (mode === 13) { return 'Reserved13'; }
    if (mode === 15) { return 'Crimson Doubles'; }
    if (mode === 16) { return 'Nightfall'; }
    if (mode === 17) { return 'Heroic Nightfall'; }
    if (mode === 18) { return 'All Strikes'; }
    if (mode === 19) { return 'Iron Banner'; }
    if (mode === 20) { return 'Reserved20'; }
    if (mode === 21) { return 'Reserved21'; }
    if (mode === 22) { return 'Reserved22'; }
    if (mode === 24) { return 'Reserved24'; }
    if (mode === 25) { return 'All Mayhem'; }
    if (mode === 26) { return 'Reserved26'; }
    if (mode === 27) { return 'Reserved27'; }
    if (mode === 28) { return 'Reserved28'; }
    if (mode === 29) { return 'Reserved29'; }
    if (mode === 30) { return 'Reserved30'; }
    if (mode === 31) { return 'Supremacy'; }
    if (mode === 32) { return 'Private Matches All'; }
    if (mode === 37) { return 'Survival'; }
    if (mode === 38) { return 'Countdown'; }
    if (mode === 39) { return 'Trials'; }
    if (mode === 40) { return 'Social'; }
    if (mode === 41) { return 'Trials Countdown'; }
    if (mode === 42) { return 'Trials Survival'; }
    if (mode === 43) { return 'Iron Banner Control'; }
    if (mode === 44) { return 'Iron Banner Clash'; }
    if (mode === 45) { return 'Iron Banner Supremacy'; }
    if (mode === 46) { return 'Scored Nightfall'; }
    if (mode === 47) { return 'Heroic NightFall (Scored)'; }
    if (mode === 48) { return 'Rumble'; }
    if (mode === 49) { return 'All Doubles'; }
    if (mode === 50) { return 'Doubles'; }
    if (mode === 51) { return 'Clash (Private)'; }
    if (mode === 52) { return 'Control (Private)'; }
    if (mode === 53) { return 'Supremacy (Private)'; }
    if (mode === 54) { return 'Countdown (Private)'; }
    if (mode === 55) { return 'Survival (Private)'; }
    if (mode === 56) { return 'Mayhem (Private)'; }
    if (mode === 57) { return 'Rumble (Private)'; }
    if (mode === 58) { return 'Heroic Adventure'; }
    if (mode === 59) { return 'Showdown'; }
    if (mode === 60) { return 'Lockdown'; }
    if (mode === 61) { return 'Scorched'; }
    if (mode === 62) { return 'Scorched Team'; }
    if (mode === 63) { return 'Gambit'; }
    if (mode === 64) { return 'All PvE Competitive'; }
    if (mode === 65) { return 'Breakthrough'; }
    if (mode === 66) { return 'Black Armory Forge'; } // BlackArmoryRun
    if (mode === 67) { return 'Salvage'; }
    if (mode === 68) { return 'Iron Banner Salvage'; }
    if (mode === 69) { return 'PvP Competitive'; }
    if (mode === 70) { return 'PvP Quickplay'; }
    if (mode === 71) { return 'Clash Quickplay'; }
    if (mode === 72) { return 'Clash Competitive'; }
    if (mode === 73) { return 'Control Quickplay'; }
    if (mode === 74) { return 'Control Competitive'; }
    if (mode === 75) { return 'Gambit Prime'; }
    if (mode === 76) { return 'Reckoning'; }
    if (mode === 77) { return 'Menagerie'; }
    if (mode === 78) { return 'Vex Offensive'; }
    if (mode === 79) { return 'Nightmare Hunt'; }
    if (mode === 80) { return 'Elimination'; }
    if (mode === 81) { return 'Momentum'; }
    if (mode === 82) { return 'Dungeon'; }
    if (mode === 83) { return 'Sundial'; }
    if (mode === 84) { return 'Trials Of Osiris'; }
    if (mode === 85) { return 'Dares'; }
    if (mode === 86) { return 'Wellspring'; }
    return 'Unknown ' + mode;
  }
}


interface PrivBungieMember {
  membershipId: string;
  uniqueName: string;
  displayName: string;
  profilePicture: number;
  profileTheme: number;
  userTitle: number;
  successMessageFlags: string;
  isDeleted: boolean;
  about: string;
  firstAccess: string;
  lastUpdate: string;
  psnDisplayName: string;
  xboxDisplayName: string;
  steamDisplayName: string;
  showActivity: boolean;
  locale: string;
  localeInheritDefault: boolean;
  showGroupMessaging: boolean;
  profilePicturePath: string;
  profileThemeName: string;
  userTitleDisplay: string;
  statusText: string;
  statusDate: string;
  blizzardDisplayName: string;
  egsDisplayName: string;
}

