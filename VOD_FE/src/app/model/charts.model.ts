export interface IDoughnutChartCfg {
 labels?: string[],
 datasets: {
    backgroundColor?: string[];
    data: any[];
    borderWidth?: number,
    borderRadius?: number,
    clip?: number;
  }[];
}
