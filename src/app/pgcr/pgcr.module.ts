import { NgModule } from '@angular/core';

import { SharedModule } from '../shared';
import { Pgcr2Component } from './pgcr2/pgcr2.component';
import { PgcrEntryDialogComponent } from './pgcr-entry-dialog/pgcr-entry-dialog.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [Pgcr2Component, PgcrEntryDialogComponent]
})
export class PGCRModule { }
