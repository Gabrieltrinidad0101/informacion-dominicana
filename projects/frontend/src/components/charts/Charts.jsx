import React, { useEffect, useState } from "react";
import { Chart } from "../chart/Chart";
import chartCss from "./charts.module.css";
import constants from "../../constants";
import { requestJson } from "../../utils/request";

export function Charts({ data,url, deparment, customTheme, compare,onClickSources }) {
  const [datas, setDatas] = useState([]);
  useEffect(() => {
    if (data) return setDatas(data);
    requestJson(`${url}/headers`).then(async (res) => {
      const urls = []
      res.forEach((item) => {
        urls.push({
          title: `${url}/${item}`,
          url: `${url}/${item}`,
        });
      });
      setDatas(urls);
    });
  }, []);
  return (
    <div className={chartCss.containerCustom}>
      {datas.map((data, index) => (
        <Chart
          onClickSources={onClickSources}
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
