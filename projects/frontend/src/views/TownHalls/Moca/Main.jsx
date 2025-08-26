import React, { useState } from "react";
import { Charts } from "../../../components/charts/Charts";
import { ListGroup } from "../../../components/list/List";
import { PieChartComponent } from "../../../components/pie/Pie";
import MainCss from "./Main.module.css";

export function Main() {
  const [currentDate, setCurrentDate] = useState();

  const data = [
    {
      title: "Nomina",
      url: "Ayuntamiento de Moca/nomina/exportToJson/payroll",
    },
    {
      title: "Empleados",
      url: "Ayuntamiento de Moca/nomina/exportToJson/employeersTotal",
    },
    {
      title: "Cantidad Total de Empleados Masculinos",
      url: "Ayuntamiento de Moca/nomina/exportToJson/employeersM",
    },
    {
      title: "Cantidad Total de Empleados Femeninos",
      url: "Ayuntamiento de Moca/nomina/exportToJson/employeersF",
    },
  ];
  const customTheme = {
    "Cantidad Total de Empleados Femeninos": {
      line: "#ab47bc",
      top: "#311536",
      bottom: "#160a19",
    },
    "Cantidad Total de Empleados Masculinos": {
      line: "#2962ff",
      top: "#0f235c",
      bottom: "#040918",
    },
  };
  return (
    <div>
      <Charts
        data={data}
        deparment="Ayuntamiento de Moca"
        customTheme={customTheme}
        compare={true}
      />
      <ListGroup
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        title={"Posición por salario"}
        url={"Ayuntamiento de Moca/nomina/"}
      />
      <div className={MainCss.display}>
        {currentDate && (
            <PieChartComponent
              type="percentage"
              simbol="%"
              description="Porcentaje de gasto por puesto"
              url={`Ayuntamiento de Moca/nomina/exportToJson/percentageOfSpendingByPosition${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`}
              compare={false}
            />
          ) && (
            <PieChartComponent
              type="employeeCount"
              description="Cantidad de empleados por posición"
              url={`Ayuntamiento de Moca/nomina/exportToJson/percentageOfSpendingByPosition${currentDate.getFullYear()}-${currentDate.getMonth()  + 1}`}
              compare={false}
            />
          )}
      </div>
    </div>
  );
}
