import { Injectable } from '@angular/core';
import { faAmazon as fabAmazon, faGithub as fabGithub, faPaypal as fabPaypal, faPlaystation as fabPlaystation, faReddit as fabReddit, faSteam as fabSteam, faTwitter as fabTwitter, faWindows as fabWindows, faXbox as fabXbox, faYoutube as fabYoutube } from '@fortawesome/free-brands-svg-icons';
import {
  faSquare as farSquare, faCheckSquare as falCheckSquare, faClone as falClone,
  faLayerGroup as falLayerGroup, faBars as falBars,
  faCopy as falCopy, faDiceD20 as falDiceD20, faDownload as falDownload, faEnvelope as falEnvelope, faEnvelopeOpen as falEnvelopeOpen,
  faExchange as falExchange, faEye as falEye, faEyeSlash as falEyeSlash, faGamepad as falGamepad, faSigma as falSigma,
  faSort as falSort, faSortDown as falSortDown, faSortUp as falSortUp, faTrophy as falTrophy,
  faSun as falSun, faTshirt as falTshirt, faSkullCow as falSkullCow, faHammer as falHammer, faGem as falGem, faHatCowboy as falHatCowboy,
  faInfoSquare as falInfoSquare,
  faCrosshairs as falCrosshairs,
  faBowArrow as falBowArrow,
  faShoppingCart as falShoppingCart,

  faCalendarAlt as farCalendar,
  faBolt as falBolt,
  faWheat as falWheat,
  faPlusSquare as falPlusSquare, faMinusSquare as falMinusSquare, faUpload as falUpload, faCloudDownload as falCloudDownload
} from '@fortawesome/pro-light-svg-icons';
import {

  faAlien as farAlien,
  faAxeBattle as farAxeBattle, faBadgeCheck as farBadgeCheck, faBookmark as farBookmark, faBalanceScale as farBalanceScale, faCheckSquare as farCheckSquare, faCheckSquare as farCheckSqure, faCog as farCog, faCopy as farCopy, faExternalLink as farExternalLink, faGem as farGem, faGift as farGift, faHeart as farHeart, faHelmetBattle as farHelmetBattle, faInfoSquare as farInfoSquare, faMapMarkerAlt as farMapMarkerAlt, faMedal as farMedal, faMinusSquare as farMinusSquare, faPalette as farPalette, faProjectDiagram as farProjectDiagram, faSearch as farSearch, faSigma as farSigma, faSpinner as farSpinner, faStar as farStar, faSync as farSync, faTable as farTable,
  faThumbtack as farThumbtack, faTimes as farTimes, faTimesSquare as farTimesSquare, faTrophy as farTrophy, faClipboardCheck as farClipboardCheck, faPercent as farPercent, faAward as farAward,
  faInfinity as falInfinity,
  faSwords as falSwords,
  faScrollOld as falScrollOld,
  faBan as falBan, faList as farList,
  faTools as farTools,
  faSign as farSign
} from '@fortawesome/pro-regular-svg-icons';

import {
  faSort as fadSort, faSortDown as fadSortDown, faSortUp as fadSortUp, faArchive as fadArchive,
  faHourglassHalf as fadHourGlassHalf, faShieldAlt as fadShieldAlt, faVault as fadVault,
 } from '@fortawesome/pro-duotone-svg-icons';
import {
  faPlug as fasPlug, 
  faGamepadAlt as fasGamepadAlt, faMinus as fasMinus, faUniversity as fasUniversity, faEnvelope as fasEnvelope,
  faHeart as fasHeart, faSort as fasSort, faPlusSquare as fasPlusSquare, faMinusSquare as fasMinusSquare,
  faHorizontalRule as fasHorizontalRule, faSignInAlt as fasSignInAlt,
  faTreasureChest as fasTreasureChest, faSlidersV as fasSlidersV, faBolt as fasBolt,
  faBurn as fasBurn, faSack as fasSack, faLayerGroup as fasLayerGroup,
  faArrowLeft as fasArrowLeft, faArrowRight as fasArrowRight,
  faChevronLeft as fasChevronLeft, faChevronRight as fasChevronRight,
  faBooks as farBooks,
  faBookmark as fasBookmark,
  faBalanceScale as fasBalanceScale, faBan as fasBan, faBed as fasBed,
  faBookSpells as fasBookSpells, faBowArrow as fasBowArrow, faBullseyePointer as fasBullseyePointer,
  faCalendarStar as fasCalendarStar, faChartLine as fasChartLine, faCheck as fasCheck,
  faCalendarAlt as fasCalendarAlt,
  faCheckSquare as fasCheckSquare, faClock as fasClock, faCog as fasCog, faCogs as fasCogs,
  faCopy as fasCopy, faEllipsisH as fasEllipsisH, faEllipsisV as fasEllipsisV, faExclamationSquare as fasExclamationSquare,
  faEye as fasEye, faEyeSlash as fasEyeSlash, faFilter as fasFilter, faFlag as fasFlag,
  faFlaskPotion as fasFlaskPotion, faForklift as fasForklift, faGem as fasGem, faGift as fasGift,
  faHelmetBattle as fasHelmetBattle, faHistory as fasHistory, faHoodCloak as fasHoodCloak,
  faInfoCircle as fasInfoCircle, faInfoSquare as fasInfoSquare, faLevelUp as fasLevelUp,
  faLevelUpAlt as fasLevelUpAlt, faLockAlt as fasLockAlt, faLockOpenAlt as fasLockOpenAlt,
  faPlaneAlt as fasPlaneAlt, faQuestionCircle as fasQuestionCircle, faSave as fasSave,
  faShieldCheck as fasShieldCheck, faSigma as fasSigma, faSortDown as fasSortDown,
  faSortUp as fasSortUp, faStar as fasStar, faSwords as fasSwords, faSync as fasSync,
  faSyncAlt as fasSyncAlt, faSyringe as fasSyringe, faTags as fasTags, faTimes as fasTimes,
  faTrash as fasTrash, faTrashAlt as fasTrashAlt, faTrophy as fasTrophy, faTshirt as fasTShirt,
  faUserFriends as fasUserFriends, faUsers as fasUsers, faVideo as fasVideo,
  faWheat as fasWheat,
  faHiking as fasHiking,
  faSignOutAlt as fasSignOutAlt,
  faCheckCircle as fasCheckCircle,
  faCircleNotch as fasCircleNotch,
  faSkullCrossbones as fasSkullCrossbones,
  faSkull as fasSkull, faStoreAlt as fasStoreAlt,
  faStore as fasStore, faUser as fasUser, faChessKnight as fasChessKnight, faTicketAlt as fasTicketAlt,
  faCabinetFiling as fasCabinetFiling, faStickyNote as fasStickyNote, faMagic as fasMagic,
  faStarOfLife as fasStarOfLife
} from '@fortawesome/pro-solid-svg-icons';




@Injectable({
  providedIn: 'root'
})
export class IconService {
  // NOTE: farSquare is actually falSquare
  public readonly fasStarOfLife = fasStarOfLife;
  public readonly farSign = farSign;
  public readonly fasStoreAlt = fasStoreAlt;
  public readonly fasHiking = fasHiking;
  public readonly farTools = farTools;
  public readonly fasStickyNote = fasStickyNote;
  public readonly fasSkull = fasSkull;
  public readonly fasSkullCrossbones = fasSkullCrossbones;
  public readonly fadShieldAlt = fadShieldAlt;
  public readonly fasCabinetFiling = fasCabinetFiling;
  public readonly fasChessKnight = fasChessKnight;
  public readonly farList = farList;
  public readonly farCalendar = farCalendar;
  public readonly fasPlug = fasPlug;
  public readonly farAward = farAward;
  public readonly farPercent = farPercent;
  public readonly fasSignOutAlt = fasSignOutAlt;
  public readonly fasCheckCircle = fasCheckCircle;
  public readonly fadHourGlassHalf = fadHourGlassHalf;
  public readonly fadArchive = fadArchive;
  public readonly fasTicketAlt = fasTicketAlt;
  public readonly farBooks = farBooks;
  public readonly falShoppingCart = falShoppingCart;
  public readonly falCrosshairs = falCrosshairs;
  public readonly falBolt = falBolt;
  public readonly falWheat = falWheat;
  public readonly falPlusSquare = falPlusSquare;
  public readonly falMinusSquare = falMinusSquare;
  public readonly falInfoSquare = falInfoSquare;
  public readonly falInfinity = falInfinity;
  public readonly falSwords = falSwords;
  public readonly falScrollOld = falScrollOld;
  public readonly falBan = falBan;
  public readonly falBars = falBars;
  public readonly fadSort = fadSort;
  public readonly fadSortUp = fadSortUp;
  public readonly fadSortDown = fadSortDown;
  public readonly falLayerGroup = falLayerGroup;
  public readonly falSun = falSun;
  public readonly falHatCowboy = falHatCowboy;
  public readonly falGem = falGem;
  public readonly falHammer = falHammer;
  public readonly falSkullCow = falSkullCow;
  public readonly fasSort = fasSort;
  public readonly falSort = falSort;
  public readonly fasHorizontalRule = fasHorizontalRule;
  public readonly fasTreasureChest = fasTreasureChest;
  public readonly fasSignInAlt = fasSignInAlt;
  public readonly fasSack = fasSack;
  public readonly fasBurn = fasBurn;
  public readonly fasBolt = fasBolt;
  public readonly fasSlidersV = fasSlidersV;
  public readonly farClipboardCheck = farClipboardCheck;

  // public readonly  = ;
  public readonly fasBed = fasBed;
  public readonly fasLayerGroup = fasLayerGroup;
  public readonly fasEye = fasEye;
  public readonly fasEyeSlash = fasEyeSlash;
  public readonly fasArrowLeft = fasArrowLeft;
  public readonly fasArrowRight = fasArrowRight;
  public readonly fasChevronLeft = fasChevronLeft;
  public readonly fasChevronRight = fasChevronRight;
  public readonly farProjectDiagram = farProjectDiagram;
  public readonly fasClock = fasClock;
  public readonly falCloudDownload = falCloudDownload;
  public readonly farGift = farGift;
  public readonly farCog = farCog;
  public readonly farBalanceScale = farBalanceScale;
  public readonly farPalette = farPalette;

  public readonly falTrophy = falTrophy;
  public readonly falGamepad = falGamepad;
  public readonly fasGamepadAlt = fasGamepadAlt;

  public readonly farSync = farSync;
  public readonly farExternalLink = farExternalLink;
  public readonly farTimes = farTimes;
  public readonly farTrophy = farTrophy;

  public readonly fasCalendarStar = fasCalendarStar;
  public readonly fasCalendarAlt = fasCalendarAlt;
  public readonly fasTimes = fasTimes;
  public readonly fasBullseyePointer = fasBullseyePointer;
  public readonly fasCheck = fasCheck;
  public readonly fasInfoSquare = fasInfoSquare;
  public readonly fasHistory = fasHistory;
  public readonly fasUserFriends = fasUserFriends;
  public readonly fasUser = fasUser;
  public readonly fasCircleNotch = fasCircleNotch;
  public readonly fasStore = fasStore;
  public readonly fasGift = fasGift;
  public readonly fasSigma = fasSigma;
  public readonly fasWheat = fasWheat;
  public readonly fasPlusSquare = fasPlusSquare;
  public readonly fasMinusSquare = fasMinusSquare;

  public readonly fabXbox = fabXbox;
  public readonly farTimesSquare = farTimesSquare;
  public readonly fabPlaystation = fabPlaystation;
  public readonly fabSteam = fabSteam;
  public readonly fabWindows = fabWindows;
  public readonly fasTrophy = fasTrophy;
  public readonly fasFlag = fasFlag;
  public readonly farInfoSquare = farInfoSquare;
  public readonly farSigma = farSigma;
  public readonly fasCog = fasCog;
  public readonly fasSync = fasSync;
  public readonly fasExclamationSquare = fasExclamationSquare;
  public readonly farCopy = farCopy;
  public readonly farTable = farTable;
  public readonly farCheckSquare = farCheckSquare;
  public readonly fasCheckSquare = fasCheckSquare;
  public readonly fasSortDown = fasSortDown;
  public readonly fasSortUp = fasSortUp;
  public readonly fasBookSpells = fasBookSpells;
  public readonly fasFlaskPotion = fasFlaskPotion;
  public readonly fasGem = fasGem;
  public readonly fasHoodCloak = fasHoodCloak;
  public readonly fasStar = fasStar;
  public readonly fasLockOpenAlt = fasLockOpenAlt;
  public readonly fasLockAlt = fasLockAlt;
  public readonly fasShieldCheck = fasShieldCheck;
  public readonly fasBan = fasBan;
  public readonly fasFilter = fasFilter;
  public readonly fasTags = fasTags;
  public readonly fasSwords = fasSwords;
  public readonly fasUsers = fasUsers;
  public readonly fasTShirt = fasTShirt;
  public readonly fasBalanceScale = fasBalanceScale;
  public readonly farAxeBattle = farAxeBattle;
  public readonly farHelmetBattle = farHelmetBattle;
  public readonly fasPlaneAlt = fasPlaneAlt;
  public readonly farGem = farGem;
  public readonly fasInfoCircle = fasInfoCircle;
  public readonly fabYoutube = fabYoutube;
  public readonly fasLevelUpAlt = fasLevelUpAlt;
  public readonly fasSave = fasSave;
  public readonly fasSyringe = fasSyringe;
  public readonly fasTrashAlt = fasTrashAlt;
  public readonly fasVideo = fasVideo;
  public readonly fasChartLine = fasChartLine;
  public readonly fasSyncAlt = fasSyncAlt;
  public readonly fasEllipsisV = fasEllipsisV;
  public readonly fasEllipsisH = fasEllipsisH;
  public readonly fasForklift = fasForklift;
  public readonly fasCogs = fasCogs;
  public readonly fasHelmetBattle = fasHelmetBattle;
  public readonly fasCopy = fasCopy;
  public readonly fasQuestionCircle = fasQuestionCircle;
  public readonly fasTrash = fasTrash;
  public readonly fasLevelUp = fasLevelUp;
  public readonly fasMagic = fasMagic;

  public readonly falBowArrow = falBowArrow;

  public readonly fasBowArrow = fasBowArrow;
  public readonly fabPaypal = fabPaypal;
  public readonly fabReddit = fabReddit;
  public readonly fabTwitter = fabTwitter;
  public readonly fabAmazon = fabAmazon;
  public readonly fabGithub = fabGithub;
  public readonly falEnvelope = falEnvelope;
  public readonly falDownload = falDownload;
  public readonly falUpload = falUpload;
  public readonly falEye = falEye;
  public readonly falEyeSlash = falEyeSlash;
  public readonly falEnvelopeOpen = falEnvelopeOpen;
  public readonly falTshirt = falTshirt;
  public readonly falExchange = falExchange;
  public readonly falClone = falClone;
  public readonly falCopy = falCopy;
  public readonly falDiceD20 = falDiceD20;

  public readonly fadVault = fadVault;
  public readonly fasEnvelope = fasEnvelope;
  public readonly fasUniversity = fasUniversity;
  public readonly falSortDown = falSortDown;
  public readonly falSortUp = falSortUp;
  public readonly falSigma = falSigma;
  public readonly falCheckSquare = falCheckSquare;
  public readonly farCheckSqure = farCheckSqure;
  public readonly farSquare = farSquare;
  public readonly farSearch = farSearch;
  public readonly farStar = farStar;
  public readonly farSpinner = farSpinner;
  public readonly farBadgeCheck = farBadgeCheck;
  public readonly farMedal = farMedal;
  public readonly farThumbtack = farThumbtack;
  public readonly farAlien = farAlien;

  public readonly farMinusSquare = farMinusSquare;

  public readonly fasMinus = fasMinus;
  public readonly farHeart = farHeart;
  public readonly fasHeart = fasHeart;
  public readonly farMapMarkerAlt = farMapMarkerAlt;

  public readonly farBookmark = farBookmark;
  public readonly fasBookmark = fasBookmark;
}
