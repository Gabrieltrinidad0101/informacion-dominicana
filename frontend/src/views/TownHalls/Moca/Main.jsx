import React from "react";
import { Chats } from "../../../components/chats/Chats";
import { ListGroup } from "../../../components/list/List";

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
      <Chats
        topic="townHalls/Moca"
        headers={headers}
        customTheme={customTheme}
      />
      <ListGroup title={"Posición por salario"} topic={"Moca"} />
    </div>
  );
}
