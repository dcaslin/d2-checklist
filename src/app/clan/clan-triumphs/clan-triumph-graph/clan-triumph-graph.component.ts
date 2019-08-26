import { Component, OnInit, Input } from '@angular/core';
import { ChartOptions, ChartType, ChartDataSets, ChartLegendOptions } from 'chart.js';
import { Label } from 'ng2-charts';

@Component({
  selector: 'd2c-clan-triumph-graph',
  templateUrl: './clan-triumph-graph.component.html',
  styleUrls: ['./clan-triumph-graph.component.scss']
})
export class ClanTriumphGraphComponent implements OnInit {
  public b: ChartLegendOptions;
  public chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      display: false
    },
    // We use these empty structures as placeholders for dynamic theming.
    scales: { xAxes: [{}], yAxes: [{}] },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
      }
    }
  };
  public chartLabels: Label[] = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  public chartData: ChartDataSets[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' }
  ];


  @Input()
  set data(all: any[]) {
    this.chartLabels = [];
    const dataDict = {};
    const data = [];
    for (const pt of all) {
      const val = Math.ceil(pt.data.percent / 10) * 10;
      if (dataDict[val] == null) {
        dataDict[val] = 1;
      } else {
        dataDict[val]++;
      }
    }
    for (let cntr = 0; cntr <= 100; cntr += 10) {
      this.chartLabels.push(cntr + '%');
      if (!dataDict[cntr]) {
        data.push(0);
      } else {
        data.push(dataDict[cntr]);
      }
    }
    this.chartData = [
      {
        data: data,
        label: 'Members'
      }
    ];
  }


  constructor() {
  }

  ngOnInit() {
  }

}
