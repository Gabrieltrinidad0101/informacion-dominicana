import React, { useEffect, useState } from "react";
import { Chart } from "../chart/Chart";
import chartCss from "./charts.module.css";
import constants from "../../constants";
import { requestJson } from "../../utils/request";

export function Charts({ data, deparment, customTheme, compare }) {
  const [datas, setDatas] = useState([]);
  useEffect(() => {
    if (data) return setDatas(data);
    const data_ = requestJson(`${urls}/headers.json`).then(async (res) => {
      setDatas(data_);
    });
  }, []);
  return (
    <div className={chartCss.containerCustom}>
      {datas.map((data, index) => (
        <Chart
          compare={compare}
          deparment={deparment}
          data={data}
          key={index}
          customTheme={customTheme}
        />
      ))}
    </div>
  );
}
