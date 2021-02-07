import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-ad-unit',
  templateUrl: './ad-unit.component.html',
  styleUrls: ['./ad-unit.component.scss']
})
export class AdUnitComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() title: string;
  @Input() adStyle: string;
  @Input() adSlot: string;

  @ViewChild('ins', { read: ElementRef, static: true }) ins!: ElementRef;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.push();
  }

  push(): void {
    if (window) {
      try {
        // tslint:disable-next-line:no-any
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        // console.log(`push ${this.title}`)
      } catch (x) {
        console.dir(x);
      }
    }
  }

  ngOnDestroy(): void {
    const iframe = this.ins.nativeElement.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.src = 'about:blank';
      iframe.remove();
      // console.log('Removing iframe');
    }
  }

}
