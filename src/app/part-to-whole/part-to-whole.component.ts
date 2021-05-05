import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ColumnChart } from '@toast-ui/chart';
import { BarController, BarElement, CategoryScale, Chart, LinearScale } from 'chart.js';
import * as d3 from 'd3';

@Component({
  selector: 'app-part-to-whole',
  templateUrl: './part-to-whole.component.html',
  styleUrls: ['./part-to-whole.component.css']
})
export class PartToWholeComponent implements OnInit {

  constructor() { }

  //PARA TOAST
  @ViewChild('csvReader') csvReader: any;
  private categorias: any = []; // Para guardar las categorias o la coordenada x
  private values: any = []; // Para guardar los valroes de las serie

  //PARA CHARTSJS
  @ViewChild('myChart') private barCanvas: ElementRef;
  nominalComparisonChart: any;
  chartsjsData = {
    labels: [],
    datasets: [
      {
        label: '',
        data: [],
      },
    ],
  };

  //PARA D3
  private svg: any;
  private margin: number;
  private width: number;
  private height: number;
  private maxY: number = 0;
  // El elemento que elige el fichero
  @ViewChild('csvReader') csvReaderd3: any;
  private d3Data: any[] = [];

  ngOnInit(): void {
  }

  uploadListener($event: any): void {

    let text = [];

    let seriesName = [];  // Para guardar el nombre de la serie

    let files = $event.srcElement.files;

    if (this.isValidCSVFile(files[0])) {

      let input = $event.target;
      let reader = new FileReader();
      reader.readAsText(input.files[0]);

      reader.onload = () => {

        let csvData = reader.result;
        let csvRecordsArray = (<String>csvData).split(/\r\n|\n/);

        let headersRow = this.getHeaderArray(csvRecordsArray);

        for (let i = 0; i < headersRow.length; i++) {
          seriesName.push(headersRow[i].trim().replace(/['"]+/g, ''));
        } //para quitar dobles comillas con las que sale del csv

        this.getDataRecordsArrayFromCSVFile(csvRecordsArray);
        this.d3getDataRecordsArrayFromCSVFile(csvRecordsArray, headersRow); //Hace falta el nombre de la cabecera para las series ({Cabecera:Value})

        //TOAST
        const toastData = {
          categories: [],
          series: [
            {
              name: '',
              data: [],
            },
          ],
        };
        toastData.categories = seriesName;
        toastData.series[0].name = "%";
        toastData.series[0].data = this.values;
        //Creación del gráfico con Toast
        this.createGraphToast(toastData);

        //-------------------------------------------------------------------------------------

        //CHARTSJS
        this.chartsjsData.labels = seriesName;
        this.chartsjsData.datasets[0].label = "%";
        this.chartsjsData.datasets[0].data = this.values;
        //Creación del gráfico con Chartsjs
        this.createGraphChartsjs(this.chartsjsData);

        //-------------------------------------------------------------------------------------

        //D3
        this.margin = 120;
        this.width = 1500 ;
        this.height = 400 ;
        //Creación del gráfico con d3
        this.createSvg();
        this.drawBars(this.d3Data);

        reader.onerror = function () {
          console.log('error is occured while reading file!');
        };
      };

    } else {
      alert("Please import valid .csv file.");
      this.fileReset();
    }
  }

  private createGraphChartsjs(data: any) {

    Chart.register(BarController, LinearScale, CategoryScale, BarElement);
    this.nominalComparisonChart = new Chart(this.barCanvas.nativeElement, {
      type: "bar",
      data: data,
      /*data: {
        labels: ['BJP', 'INC', 'AAP', 'CPI', 'CPI-M', 'NCP'],
        datasets: [{
          label: '# of Votes',
          data: [200, 50, 30, 15, 20, 34],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)'
          ],
          borderColor: [
            'rgba(255,99,132,1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },*/
      options: {
        scales: {
          y: {
            type: 'linear',
            beginAtZero: true
          }
        }
      }
    });


  }

  createGraphToast(data: any) {

    const options = {
      chart: { title: '', width: 15000, height: 500 },
    };

    options.chart.title = "Toast part to whole";
    options.chart.width = 70 * data.series[0].data.length;

    const el = document.getElementById('grafica');
    const chart = new ColumnChart({ el, data, options });


  }

  private createSvg(): void {
    this.svg = d3.select("figure#imagen")
      .append("svg")
      .attr("width", this.width + (this.margin * 2))
      .attr("height", this.height + (this.margin * 2))
      .attr("height", this.height + (this.margin * 2))
      .append("g")
      .attr("transform", "translate(" + this.margin + "," + this.margin + ")");

  }

  private drawBars(data: any[]): void {
    // Create the X-axis band scale

    const x = d3.scaleBand()
      .range([0, this.width])
      .domain(data.map(d => d.foodSupply))
      .padding(0.2);

    // Draw the X-axis on the DOM
    this.svg.append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    // Create the Y-axis band scale
    const y = d3.scaleLinear()
      .domain([0, this.maxY])
      .range([this.height, 0]);

    // Draw the Y-axis on the DOM
    this.svg.append("g")
      .call(d3.axisLeft(y));

    // Create and fill the bars
    this.svg.selectAll("bars")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => x(d.foodSupply))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => this.height - y(d.value))
      .attr("fill", "#d04a35");
  }


  d3getDataRecordsArrayFromCSVFile(csvRecordsArray: any, header: any[]) {

    var encontrado = false;
    let country: any;
    let foodSupply: any;
    let value: any;

    for (let i = 1; i < csvRecordsArray.length && !encontrado; i++) {
      let currentRecord = (<string>csvRecordsArray[i]).split(',');

      country = currentRecord[0].trim().replace(/['"]+/g, '');

      if (country === "Spain"){
        for (let j = 1; j < currentRecord.length - 8; j++) {
          foodSupply = header[j-1].trim().replace(/['"]+/g, '');
          if (!isNaN(parseFloat(currentRecord[j]))) {
            value = parseFloat(currentRecord[j].trim().replace(/['"]+/g, ''));
            if (value > this.maxY) {
              this.maxY = value;
            }
          } else {
            value = 0;
          }
          this.d3Data.push({foodSupply, value})
        }
        encontrado = true;
      }
    }
  }


  getDataRecordsArrayFromCSVFile(csvRecordsArray: any) {

    var encontrado = false;

    for (let i = 1; i < csvRecordsArray.length && !encontrado; i++) {
      let currentRecord = (<string>csvRecordsArray[i]).split(',');
      if (currentRecord[0] === "\"Spain\"") {
        for (let j = 1; j < currentRecord.length - 8; j++) {
          let aux = Number(parseFloat(currentRecord[j]).toFixed(2));
          if (isNaN(parseFloat(currentRecord[j]))) {
            aux = 0
          }
          this.values.push(aux);
        }
        encontrado = true; //Para que no siga buscando cuando encuentre España
      }
    }
  }

  isValidCSVFile(file: any) {
    return file.name.endsWith(".csv");
  }

  getHeaderArray(csvRecordsArr: any) {
    let headers = (<string>csvRecordsArr[0]).split('\",');
    let headerArray = [];
    for (let j = 1; j < headers.length - 8; j++) {
      headerArray.push(headers[j]);
    }
    return headerArray;
  }

  fileReset() {
    this.csvReader.nativeElement.value = "";
    this.categorias = [];
    this.values = [];
  }


}