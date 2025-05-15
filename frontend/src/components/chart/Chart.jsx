import React, { useState, useRef, useEffect } from "react";
import { chartBase } from "./chartBase";
import "./chart.css";
import { CompareCharts } from "../compareCharts/CompareCharts";
import { requestJson } from "../../utils/request";
let isLoad = {};
export function Chart({ description, topic, customTheme }) {
  const [openModal, setOpenModal] = useState(false);
  const [chart, setChart] = useState(null);
  const [areaSeries, setAreaSeries] = useState(null);
  const containerChart = useRef();

  const verifyVisibility = async (entry) => {
    if (isLoad[description] || !entry[0].isIntersecting) return;
    isLoad[description] = entry[0].isIntersecting;
    setChart(await chartBase(containerChart.current, description, topic, customTheme));
  };

  useEffect(() => {
    if (Object.keys(isLoad) <= 0) isLoad = {};
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
          open={openModal}
          setOpen={setOpenModal}
          addNewChart={addNewChart}
        />
      )}
      <div className="custom-chart-card">
        <div className="custom-chart-card-title">
          <h3>{description}</h3>
          <div>
            <a href="#">Fuentes</a>
            <a href="#" onClick={() => setOpenModal(true)}>
              Comparar
            </a>
          </div>
        </div>
        <div>
          <div ref={containerChart}></div>
        </div>
      </div>
    </>
  );
}
