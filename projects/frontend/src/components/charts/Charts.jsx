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
        const isObj = typeof item === 'object' && item !== null
        const name = isObj ? item.title : item
        urls.push({
          title: `${url}/${name}`,
          url: `${url}/${name}`,
          indicatorId: item?.indicatorId ?? null,
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
