import { useState, useRef, useEffect } from "react";
import { chartBase } from "./chartBase";
import "./chart.css";
import { CompareCharts } from "../compareCharts/CompareCharts";
import { requestJson } from "../../utils/request";

let isLoad = {}
export function Chart({ data, customTheme,compare,deparment,onClickSources }) {
  const [openModal, setOpenModal] = useState(false);
  const [chart, setChart] = useState(null);
  const [areaSeries, setAreaSeries] = useState(null);
  const containerChart = useRef();


  const verifyVisibility = async (entry) => {
    if (isLoad[data.title] || !entry[0].isIntersecting) return;
    isLoad[data.title] = entry[0].isIntersecting;
    setChart(await chartBase({container: containerChart.current, data, customTheme,deparment,onClickSources}));
  };

  useEffect(() => {
    isLoad = {}
    const observer = new IntersectionObserver(verifyVisibility);
    observer.observe(containerChart.current);
  }, []);

  const addNewChart = async (url) => {
    if(areaSeries) chart.removeSeries(areaSeries);
    const data2 = await requestJson(url);
    const newAreaSeries = chart.addAreaSeries({
      topColor: "#092e32",
      bottomColor: "rgba(5, 27, 29, .5)",
      lineColor: "rgba(38, 198, 218, 1)",
      lineWidth: 2,
    });
    newAreaSeries.setData(data2);
    setAreaSeries(newAreaSeries);
  };

  return (
    <>
      {openModal && (
        <CompareCharts
          include={data.title}
          notInclude={deparment}
          open={openModal}
          setOpen={setOpenModal}
          addNewChart={addNewChart}
        />
      )}
      <div className="custom-chart-card">
        <div className="custom-chart-card-title">
          <h3>{data.title}</h3>
          <div>
            <a href="#">Fuentes</a>
            {compare && <a href="#" onClick={() => setOpenModal(true)}>
              Comparar
            </a>}
          </div>
        </div>
        <div>
          <div ref={containerChart}></div>
        </div>
      </div>
    </>
  );
}
