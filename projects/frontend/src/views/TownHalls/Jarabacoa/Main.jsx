import React from "react";
import { Charts } from "../../../components/charts/Charts";
import { ListGroup } from "../../../components/list/List";
import { Pie } from "../../../components/pie/Pie";
import MainCss from  "./Main.module.css";

export function Main() {
  const headers = [
    "Nomina",
    "Cantidad Total de Empleados",
    "Cantidad Total de Empleados Masculinos",
    "Cantidad Total de Empleados Femeninos",
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
        topic="townHalls/Jarabacoa"
        headers={headers}
        deparment="Ayuntamiento de Jarabacoa"
        customTheme={customTheme}
        compare={true}
      />
      <ListGroup title={"Posición por salario"} topic={"Jarabacoa"} />
      <div className={MainCss.display}>
        <Pie description="Porcentaje de gasto por puesto" compare={true} />
        <Pie description="Cantidad de empleados por posición" compare={true} />
      </div>
    </div>
  );
}
