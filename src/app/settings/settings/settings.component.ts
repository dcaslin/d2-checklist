import { Component, OnInit, OnDestroy } from '@angular/core';
import { StorageService } from '../../service/storage.service';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'anms-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {

  private unsubscribe$: Subject<void> = new Subject<void>();
  theme: string =  "default-theme";
  disableads: boolean = false;

  themes = [
    { value: 'default-theme', label: 'Default' },
    { value: 'light-theme', label: 'Light' },
    { value: 'black-theme', label: 'Black' },
  ];

  adChoices = [
    { value: false, label: 'Show Ads' },
    { value: true, label: 'Disable Ads' }
  ];

  constructor(private storageService: StorageService) {
    this.theme = this.storageService.getItem("theme", "default-theme");
    this.disableads = this.storageService.getItem("disableads", false);

    this.storageService.settingFeed
      .takeUntil(this.unsubscribe$)
      .subscribe(
      x => {
        if (x.theme != null) {
          this.theme = x.theme;
        }
        if (x.disableads != null) {
          this.disableads = x.disableads;
        }
      });
    this.storageService.refresh();
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
  }

  onThemeSelect({ value }) {
    this.storageService.setItem("theme", value);
  }
  
  onDisableAdsSelect({ value }) {
    this.storageService.setItem("disableads", value);
  }

}
