
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../service/auth.service';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';


@Component({
  selector: 'd2c-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent extends ChildComponent implements OnInit, OnDestroy {
  statusMsg = 'Authorizing';
  errMsg: string = null;

  constructor(
    storageService: StorageService, private authService: AuthService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
  }

  async fetch(code: string, state: string) {
    this.statusMsg = 'Authenticating to Bungie';
    if (code != null) {
      try {
        await this.authService.fetchTokenFromCode(code, state);
        this.statusMsg = 'Successfully logged in...';
        const sRoutes = localStorage.getItem('login-target');
        localStorage.removeItem('login-target');
        let routes: string[] = ['/home'];
        if (sRoutes) {
          routes = JSON.parse(sRoutes);
        }
        this.router.navigate(routes);
      } catch (x) {
        this.statusMsg = 'Authentication failed';
        this.errMsg = 'Error: ' + JSON.stringify(x);
      }
    }
  }


  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe(queryParams => {
      const code: string = queryParams['code'];
      const state: string = queryParams['state'];
      this.fetch(code, state);
    });
  }
}
