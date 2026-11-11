import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { ClassAllowed, Player } from '@app/service/model';
import { VendorDeals } from '@app/service/vendor.service';
import { NgIf, NgFor } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { CollectionDealsComponent } from '../collection-deals/collection-deals.component';
import { WeaponDealsComponent } from '../weapon-deals/weapon-deals.component';
import { ArmorDealsComponent } from '../armor-deals/armor-deals.component';

const IGNORED_CLASSES_KEY = 'deals-ignored-classes';

export interface DealsClass {
  classType: ClassAllowed;
  name: string;
  emblemPath: string;
}

// drop armor deals (and class-specific collection items) for classes the user has chosen to ignore
export function filterDealsByClass(deals: VendorDeals | null, ignoredClasses: ClassAllowed[]): VendorDeals | null {
  if (deals == null || ignoredClasses.length == 0) {
    return deals;
  }
  const keep = (c: ClassAllowed) => ignoredClasses.indexOf(c) < 0;
  return {
    ...deals,
    legendary: deals.legendary.filter(cib => keep(cib.classType)),
    exotic: deals.exotic.filter(eib => keep(eib.gear[0].classAllowed)),
    collection: deals.collection
      .map(vc => ({ ...vc, data: vc.data.filter(i => keep(i.classAllowed)) }))
      .filter(vc => vc.data.length > 0)
  };
}

function loadIgnoredClasses(): ClassAllowed[] {
  try {
    const s = localStorage.getItem(IGNORED_CLASSES_KEY);
    return s ? JSON.parse(s) : [];
  } catch (e) {
    console.log('Error loading ignored deal classes: ' + e);
    return [];
  }
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-deals',
    templateUrl: './deals.component.html',
    styleUrls: ['./deals.component.scss'],
    imports: [NgIf, NgFor, MatCheckbox, CollectionDealsComponent, WeaponDealsComponent, ArmorDealsComponent]
})
export class DealsComponent {

  @Input() debugmode!: boolean;
  @Input() loading!: boolean;
  @Input() vendorsLoading!: boolean;
  @Input() set vendorDeals(val: VendorDeals) {
    this.vendorDeals$.set(val);
  }
  @Input() set player(val: Player) {
    this.player$.set(val);
  }

  @Output() refresh = new EventEmitter<void>();

  private vendorDeals$ = signal<VendorDeals | null>(null);
  private player$ = signal<Player | null>(null);
  public ignoredClasses = signal<ClassAllowed[]>(loadIgnoredClasses());

  // one entry per class the player actually has, using that character's emblem as its icon
  public classes = computed<DealsClass[]>(() => {
    const returnMe: DealsClass[] = [];
    for (const c of this.player$()?.characters ?? []) {
      if (returnMe.find(x => x.classType == c.classType)) {
        continue;
      }
      returnMe.push({ classType: c.classType, name: c.className, emblemPath: c.emblemPath });
    }
    return returnMe.sort((a, b) => a.classType - b.classType);
  });

  public classEmblems = computed<Record<number, string>>(() => {
    const returnMe: Record<number, string> = {};
    for (const c of this.classes()) {
      returnMe[c.classType] = c.emblemPath;
    }
    return returnMe;
  });

  public filteredDeals = computed(() => filterDealsByClass(this.vendorDeals$(), this.ignoredClasses()));

  public isShown(classType: ClassAllowed): boolean {
    return this.ignoredClasses().indexOf(classType) < 0;
  }

  public toggleClass(classType: ClassAllowed, show: boolean) {
    const ignored = this.ignoredClasses().filter(x => x != classType);
    if (!show) {
      ignored.push(classType);
    }
    this.ignoredClasses.set(ignored);
    localStorage.setItem(IGNORED_CLASSES_KEY, JSON.stringify(ignored));
  }

}
