import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener, Input, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'd2c-ad-slot',
  templateUrl: './ad-slot.component.html',
  styleUrls: ['./ad-slot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdSlotComponent extends ChildComponent implements OnInit, AfterViewInit {


  @Input() adType = 'unknown';

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
    storageService: StorageService,

    // private router: Router,
    // private route: ActivatedRoute
  ) {
    super(storageService);

  }

  @HostListener('window:resize', [])
  private onResize() {
    this.screenWidth$.next(window.innerWidth);
  }

  ngOnInit(): void {
    this.screenWidth$.next(window.innerWidth);

    // this.router.events.pipe(
    //   filter(routeEvent => routeEvent instanceof NavigationEnd),
    //   takeUntil(this.unsubscribe$)).subscribe(x => {
    //     console.log('Blah blah blah');
    //     this.busyRouting$.next(true);
    //     setTimeout(()=>{
    //       this.busyRouting$.next(false);
    //       console.log("Done");
    //     }, 500);
    //   });
  }


  ngAfterViewInit(): void {
    this.push();
  }

  push(): void {
    if (window) {
      try {
        // tslint:disable-next-line:no-any
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (x) {
        console.dir(x);
      }
    }
  }

}
