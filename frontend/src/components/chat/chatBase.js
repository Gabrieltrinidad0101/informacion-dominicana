import * as LightweightCharts from "lightweight-charts"

export const ChatBase = async (container,description) => {
	var chartElement = document.createElement('div');

	var chart = LightweightCharts.createChart(chartElement, {
		width: 450,
		height: 250,
		rightPriceScale: {
			borderVisible: false,
		},
		timeScale: {
			borderVisible: false,
		},
	});

	container.appendChild(chartElement);

	var areaSeries = chart.addAreaSeries({
		topColor: 'rgba(33, 150, 243, 0.56)',
		bottomColor: 'rgba(33, 150, 243, 0.04)',
		lineColor: 'rgba(33, 150, 243, 1)',
		lineWidth: 2,
	});

	var darkTheme = {
		chart: {
			layout: {
				background: {
					type: 'solid',
					color: '#1b1b1d',
				},
				lineColor: '#1b1b1d',
				textColor: '#D9D9D9',
			},
			grid: {
				vertLines: {
					color: '#1b1b1d',
				},
				horzLines: {
					color: '#1b1b1d',
				},
			},
		},
		series: {
			topColor: 'rgba(32, 226, 47, 0.56)',
			bottomColor: 'rgba(32, 226, 47, 0.04)',
			lineColor: 'rgba(0, 0, 0, 1)',
		},
	};
	chart.applyOptions(darkTheme.chart);

	try{
		const res = await fetch(`http://127.0.0.1:5500/processedData/bancoMundial/${description}.json`)
		const data = await res.json()
		areaSeries.setData(data);
	}catch(error){
		console.log(description,"   ",error)
	}
}
