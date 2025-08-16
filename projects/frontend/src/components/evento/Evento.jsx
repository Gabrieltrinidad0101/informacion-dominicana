import { DataGrid } from "@mui/x-data-grid";
import React, { useEffect } from "react";
import { SimpleSelect } from "../inputs/simpleSelects";
import { InputText } from "../inputs/inputText";
import EventsCss from "./Evento.module.css";
import { Button } from "@mui/material";

export function Evento({exchangeName}) {
  const [downloadLinks, setDownloadLinks] = React.useState([]);
  const [columns, setColumns] = React.useState([]);
  const [search, setSearch] = React.useState({});

  const searchData = async () => {
    try {
      const data = await fetch(
        search.key
          ? `http://127.0.0.1:3001/find?exchangeName=${exchangeName}&${search.key}=${search.value}`
          : `http://127.0.0.1:3001/find?exchangeName=${exchangeName}`
      );
      const json = await data.json();
      if(!json || json.length === 0) return;
      const columns_ = Object.keys(json[0])
        .map((key) => {
          if (key === "__v") return;
          return {
            field: key,
            headerName: key,
            flex: 1,
          };
        })
        .filter((column) => column);
      setColumns(columns_);
      setDownloadLinks(json);
    }catch {

    }
  };

  const execute = async () => {
    try {
      await fetch(`http://127.0.0.1:3001/reExecuteEvents`, {
        body: JSON.stringify({
          [search.key]: search.value,
          exchangeName: exchangeName
        }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch {
      
    }
  };

  const deleteEvents = async () => {
    try {
      await fetch(`http://127.0.0.1:3001/deleteEvents`, {
        body: JSON.stringify({
          [search.key]: search.value,
          exchangeName: exchangeName
        }),
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      await searchData();
    } catch {
      
    }
  };

  useEffect(() => {
    searchData();
  }, []);

  const onChangeValue = (e) => {
    setSearch((prev) => ({
      ...prev,
      value: e.target.value,
    }));
  };

  const onChangeKey = (e) => {
    setSearch((prev) => ({
      ...prev,
      key: e.target.value,
    }));
  };

  return (
    <div>
      <h2>{exchangeName}</h2>
      <div className={EventsCss.inputs}>
        <SimpleSelect
          name="Instituciones"
          datas={columns.map((columns) => columns.field)}
          onChange={(e) => onChangeKey(e)}
        ></SimpleSelect>
        <InputText onChangeSearch={onChangeValue} />
        <Button onClick={searchData}>Buscar</Button>
        <Button onClick={execute} >Ejecutar</Button>
        <Button onClick={deleteEvents} >Eliminar</Button>
      </div>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={downloadLinks}
          pageSizeOptions={[10]}
          className={EventsCss.dataGrid}
          density="compact"
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          columns={columns}
          getRowId={(row) => row._id}
        ></DataGrid>
      </div>
    </div>
  );
}
