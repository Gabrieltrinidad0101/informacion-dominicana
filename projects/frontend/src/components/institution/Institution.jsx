import React, { useState } from "react";
import { Charts } from "../charts/Charts";
import { ListGroup } from "../list/List";
import { PieChartComponent } from "../pie/Pie";
import InstitutionCss from "./Institution.module.css";

export function Institution({institutionName}) {
  const [currentDate, setCurrentDate] = useState();

  const data = [
    {
      title: "Nomina",
      url: `${institutionName}/nomina/exportToJson/payroll`,
    },
    {
      title: "Empleados",
      url: `${institutionName}/nomina/exportToJson/employeersTotal`,
    },
    {
      title: "Cantidad Total de Empleados Masculinos",
      url: `${institutionName}/nomina/exportToJson/employeersM`,
    },
    {
      title: "Cantidad Total de Empleados Femeninos",
      url: `${institutionName}/nomina/exportToJson/employeersF`,
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
        deparment={institutionName}
        customTheme={customTheme}
        compare={true}
        onClickSources={(date)=> setCurrentDate(date)}
      />
      <ListGroup
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        title={"Posición por salario"}
        institution={institutionName}
        url={`${institutionName}/nomina/`}
      />
      <div className={InstitutionCss.display}>
        {currentDate && (
          <PieChartComponent
            type="averageSalaryPercentage"
            simbol="%"
            description="Porcentaje de gasto por puesto"
            url={`${institutionName}/nomina/exportToJson/percentageOfSpendingByPosition${currentDate.toISOString().slice(0, 7)}`}
            compare={false}
          />
        )}
        {currentDate && (
          <PieChartComponent
            type="employeeCount"
            description="Cantidad de empleados por posición"
            url={`${institutionName}/nomina/exportToJson/percentageOfSpendingByPosition${currentDate.toISOString().slice(0, 7)}`}
            compare={false}
          />
        )}
      </div>
    </div>
  );
}
