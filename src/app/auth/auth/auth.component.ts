
import {takeUntil} from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import { BungieService} from '../../service/bungie.service';
import { StorageService } from '../../service/storage.service';
import { AuthService } from '../../service/auth.service';
import {ChildComponent} from '../../shared/child.component';

@Component({
  selector: 'anms-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthComponent  extends ChildComponent implements OnInit, OnDestroy {
  msg: string;

  constructor(private bungieService: BungieService,
    storageService: StorageService, private authService: AuthService,
    private route: ActivatedRoute, private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
  }


  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe(queryParams => {
      const code: string = queryParams['code'];
      const state: string = queryParams['state'];
      this.msg = 'Authenticating to Bungie';
      if (code != null) {
        this.authService.fetchTokenFromCode(code, state).then((success: boolean) => {
          this.msg = 'Success: ' + success;
          if (success) {
            this.router.navigate(['/home']);
          }

        }).catch(x => {
          this.msg = JSON.stringify(x);
          this.ref.markForCheck();
        });
      }
    });
  }
}
