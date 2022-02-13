import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PlayerTriumph } from '@app/clan/clan-state.service';
import { ChartDataSets, ChartLegendOptions, ChartOptions } from 'chart.js';
import { Label } from 'ng2-charts';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-triumph-graph',
  templateUrl: './clan-triumph-graph.component.html',
  styleUrls: ['./clan-triumph-graph.component.scss']
})
export class ClanTriumphGraphComponent {
  public b: ChartLegendOptions;
  public chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      display: false
    },
    scales: { xAxes: [{}], yAxes: [{}] },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
      }
    }
  };
  public chartLabels: Label[] = [];
  public chartData: ChartDataSets[] = [];


  @Input()
  set data(all: PlayerTriumph[]) {
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

}
