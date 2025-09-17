import * as LightweightCharts from "lightweight-charts"
import { requestJson } from "../../utils/request";

export const chartBase = async (container, data, customTheme,deparment) => {
	try {
		const chartElement = document.createElement('div');
		const superContainer = container.parentElement.parentElement.getBoundingClientRect()
		const width = window.innerWidth > 1252 ? 450 : superContainer.width
		const height = window.innerWidth > 1252 ? 350 : superContainer.height
		const chart = LightweightCharts.createChart(chartElement, {
			width: width,
			height: height - 100,
			rightPriceScale: {
				borderVisible: false,
			},
			timeScale: {
				borderVisible: false,
			},

			localization: {
				priceFormatter: (val) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
			},
		});

		container.appendChild(chartElement);

		const areaSeries = chart.addAreaSeries({
			topColor: customTheme?.[data.title]?.top ?? 'rgba(33, 150, 243, 0.56)',
			bottomColor: customTheme?.[data.title]?.bottom ?? 'rgba(33, 150, 243, 0.04)',
			lineColor: customTheme?.[data.title]?.line ?? 'rgba(33, 150, 243, 1)',
			lineWidth: 2,
		});

		const darkTheme = {
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
		const data1 = await requestJson(data.url)
		areaSeries.setData(data1);

		const toolTipWidth = 80;
		const toolTipHeight = 80;
		const toolTipMargin = 15;

		const toolTip = document.createElement('div');
		toolTip.style = `width: 150px; height: 80px; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border: 1px solid; border-radius: 2px;font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`;
		toolTip.style.background = 'white';
		toolTip.style.color = 'black';
		toolTip.style.borderColor = '#2962FF';
		container.appendChild(toolTip);

		let dateStr = ""
		window.addEventListener('click', (e) => {
			const rect = document.getElementById(data.url)?.getBoundingClientRect()
			if(!rect) return
			if (e.clientX > rect.left && e.clientX < rect.right && e.clientY > rect.top && e.clientY < rect.bottom) {
				window.open(`comparar datos?date=${dateStr}&institution=${deparment}`, '_blank')
				console.log(`comparar datos?date=${dateStr}&institution=${deparment}`)
			}
		})


		chart.subscribeCrosshairMove(param => {
			if (
				param.point === undefined ||
				param.sourceEvent === undefined ||
				!param.time ||
				param.point.x < 0 ||
				param.point.x > chartElement.clientWidth ||
				param.point.y < 0 ||
				param.point.y > chartElement.clientHeight
			) {
				toolTip.style.display = 'none';
			} else {
				dateStr = param.time;
				toolTip.style.display = 'block';
				const data_ = param.seriesData.get(areaSeries);
				const price = data_.value !== undefined ? data_.value : data_.close;
				const coordinate = areaSeries.priceToCoordinate(price);
				toolTip.innerHTML = `<div>
            fecha: ${dateStr}
			<br/>
			valor: ${price}
			<br/>
			<a href="https://www.google.com/search?q=${dateStr}" id="${data.url}" target="_blank">Ver fuente</a>
            </div>`;
				toolTip.style.left = (param.sourceEvent.pageX  - toolTipWidth / 2) + 'px';
				toolTip.style.top = (param.sourceEvent.pageY - 60) + 'px';
			}
		});
		return chart
	} catch (error) {
		console.log(data, "   ", error)
	}
}
