import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener, Input, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NgIf, AsyncPipe } from '@angular/common';
import { NitroUnitComponent } from './nitro-unit/nitro-unit.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-ad-slot',
    templateUrl: './ad-slot.component.html',
    styleUrls: ['./ad-slot.component.scss'],
    imports: [NgIf, NitroUnitComponent, AsyncPipe]
})
export class AdSlotComponent extends ChildComponent implements OnInit {
  @Input() adType = 'unknown';
  @Input() navigating = false;

  screenWidth$: BehaviorSubject<number> = new BehaviorSubject<number>(window.innerWidth);
  busyRouting$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  // Desktop
  // Right-fat - 5274568322, 300 x 600

  // In between
  // Banner - 6828141388, 970 x 90

  // Mobile
  // Banner: 6797379468, 300 x 50
  // Footer: 4516838661, 300 x 200

  constructor(
    // private router: Router,
    private route: ActivatedRoute
  ) {
    super();

  }

  @HostListener('window:resize', [])
  private onResize() {
    this.screenWidth$.next(window.innerWidth);
  }

  ngOnInit(): void {
    this.screenWidth$.next(window.innerWidth);
  }
}
