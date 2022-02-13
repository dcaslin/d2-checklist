import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-ad-unit',
  templateUrl: './ad-unit.component.html',
  styleUrls: ['./ad-unit.component.scss']
})
export class AdUnitComponent implements AfterViewInit, OnDestroy {
  @Input() title: string;
  @Input() adStyle: string;
  @Input() adSlot: string;

  @ViewChild('ins', { read: ElementRef, static: true }) ins!: ElementRef;

  ngAfterViewInit(): void {
    this.push();
  }

  push(): void {
    if (window) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
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
