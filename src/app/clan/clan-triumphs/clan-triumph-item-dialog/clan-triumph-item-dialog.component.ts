import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ClanSearchableTriumph, ClanStateService } from '@app/clan/clan-state.service';
import { Sort } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { Label } from 'ng2-charts';
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import { IconService } from '@app/service/icon.service';

@Component({
  selector: 'd2c-clan-triumph-item-dialog',
  templateUrl: './clan-triumph-item-dialog.component.html',
  styleUrls: ['./clan-triumph-item-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanTriumphItemDialogComponent extends ChildComponent implements OnInit {
  sort: Sort = {
    name: 'pct',
    ascending: false
  };


  public barChartOptions: ChartOptions = {
    responsive: true,
    // We use these empty structures as placeholders for dynamic theming.
    scales: { xAxes: [{}], yAxes: [{}] },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
      }
    }
  };
  public barChartLabels: Label[] = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  public barChartType: ChartType = 'bar';
  public barChartLegend = false;
  public barChartData: ChartDataSets[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' }
  ];

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public dialogRef: MatDialogRef<ClanTriumphItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public triumph: ClanSearchableTriumph) {
    super(storageService);
    this.barChartLabels = [];
    const dataDict = {};
    const data = [];
    for (const pt of triumph.all) {
      const val = Math.ceil(pt.data.percent / 10) * 10;
      if (dataDict[val] == null) {
        dataDict[val] = 1;
      } else {
        dataDict[val]++;
      }
    }
    for (let cntr = 0; cntr <= 100; cntr += 10) {
      this.barChartLabels.push(cntr + '%');
      if (!dataDict[cntr]) {
        data.push(0);
      } else {
        data.push(dataDict[cntr]);
      }
    }
    this.barChartData = [
      {
        data: data,
        label: 'Members'
      }
    ];

  }


  sortData(field: string) {
    if (field === this.sort.name) {
      this.sort.ascending = !this.sort.ascending;
    } else {
      this.sort.ascending = true;
      this.sort.name = field;
    }
    ClanStateService.sortTriumphs(this.triumph, this.sort);
  }


  ngOnInit() {
  }

}
