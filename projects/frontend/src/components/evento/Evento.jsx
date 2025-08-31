import { DataGrid } from "@mui/x-data-grid";
import React, { useEffect } from "react";
import { SimpleSelect } from "../inputs/simpleSelects";
import { InputText } from "../inputs/inputText";
import EventsCss from "./Evento.module.css";
import { Button, Dialog, DialogTitle, DialogContent } from "@mui/material";


function JsonPreview({ file }) {
  const [data, setData] = React.useState(null);

  useEffect(() => {
    fetch(`http://localhost:5500/data/${file}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setData({ error: "Failed to load JSON" }));
  }, [file]);

  if (!data) return <p>Loading JSON...</p>;

  return (
    <pre
      style={{
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        maxHeight: "500px",
        overflow: "auto",
        background: "#f5f5f5",
        padding: "10px",
        borderRadius: "4px",
      }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}


export function Evento({ exchangeName }) {
  const [downloadLinks, setDownloadLinks] = React.useState([]);
  const [columns, setColumns] = React.useState([]);
  const [search, setSearch] = React.useState({});
  const [open, setOpen] = React.useState(false); // modal control
  const [cellData, setCellData] = React.useState(null); // clicked cell value

  const searchData = async () => {
    try {
      const data = await fetch(
        search.key
          ? `http://127.0.0.1:3001/find?exchangeName=${exchangeName}&${search.key}=${search.value}`
          : `http://127.0.0.1:3001/find?exchangeName=${exchangeName}`
      );
      const json = await data.json();
      if (!json || json.length === 0) {
        setDownloadLinks([]);
        return;
      }
      const columns_ = Object.keys(json[0])
        .map((key) => {
          if (key === "__v") return;
          return {
            field: key,
            headerName: key,
            flex: 1,
            hide: true
          };
        })
        .filter((column) => column);
      setColumns(columns_);
      setDownloadLinks(json);
    } catch {}
  };

  const execute = async () => {
    try {
      await fetch(`http://127.0.0.1:3001/reExecuteEvents`, {
        body: JSON.stringify({
          [search.key]: search.value,
          exchangeName: exchangeName,
        }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch {}
  };

  const deleteEvents = async () => {
    try {
      await fetch(`http://127.0.0.1:3001/deleteEvents`, {
        body: JSON.stringify({
          [search.key]: search.value,
          exchangeName: exchangeName,
        }),
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      await searchData();
    } catch {}
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

  // helper: detect type
  const renderCellContent = () => {
  if (!cellData?.value) return null;

  const value = String(cellData.value).trim();

  // Images
  if (value.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
    return (
      <img
        src={`http://localhost:5500/data/${value}`}
        alt="cell content"
        style={{ maxWidth: "100%", maxHeight: "500px" }}
      />
    );
  }

  // PDFs
  if (value.match(/\.pdf$/i)) {
    return (
      <iframe
        src={value.includes('http') ? value : `http://localhost:5500/data/${value}`}
        width="100%"
        height="500px"
        style={{ border: "none" }}
        title="PDF Viewer"
      />
    );
  }

  // JSON files
  if (value.match(/\.json$/i)) {
    return <JsonPreview file={value} />;
  }

  // fallback: text
  return <p>{value}</p>;
};


  return (
    <div>
      <h2>{exchangeName}</h2>
      <div className={EventsCss.inputs}>
        <SimpleSelect
          name="Instituciones"
          datas={columns.map((columns) => columns.field)}
          onChange={(e) => onChangeKey(e)}
        />
        <InputText onChangeSearch={onChangeValue} />
        <Button onClick={searchData}>Buscar</Button>
        <Button onClick={execute}>Ejecutar</Button>
        <Button onClick={deleteEvents}>Eliminar</Button>
      </div>

      <div style={{ height: 500, width: "100%" }}>
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
          onCellDoubleClick={(params) => {
            setCellData({
              column: params.field,
              value: params.value,
              row: params.row,
            });
            setOpen(true);
          }}
        />
      </div>

      {/* Modal */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Cell Content</DialogTitle>
        <DialogContent>
          <p>
            <b>Column:</b> {cellData?.column}
          </p>
          <p>
            <b>Value:</b> {String(cellData?.value)}
          </p>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(cellData?.row, null, 2)}
          </pre>
          {renderCellContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
