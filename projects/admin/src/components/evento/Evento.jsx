import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { SimpleSelect } from "../inputs/simpleSelects";
import { InputText } from "../inputs/inputText";
import EventsCss from "./Evento.module.css";
import { Button, Dialog, DialogTitle, DialogContent, Box, Checkbox, FormControlLabel, RadioGroup, Radio } from "@mui/material";
import constants from "../../constants";
import { useHistory } from "react-router";

function JsonPreview({ file }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${constants.urlData}/${file}`)
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


export function Evento({ exchangeName,queryParams }) {
  const [downloadLinks, setDownloadLinks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [search, setSearch] = useState(JSON.parse(queryParams.get(exchangeName)) ?? {});
  const [open, setOpen] = useState(false);
  const [cellData, setCellData] = useState(null);
  const [openExecuteModal, setOpenExecuteModal] = useState(false);
  const [force, setForce] = useState(false);
  const [typeOfExecute, setTypeOfExecute] = useState('completeExecution');

  const history = useHistory();

  const searchData = async () => {
    try {
      const data = await fetch(
        Object.keys(search).length > 0
          ? `${constants.apiEvents}/find?exchangeName=${exchangeName}${Object.keys(search).map((key) => `&${key}=${search[key]}`).join('')}`
          : `${constants.apiEvents}/find?exchangeName=${exchangeName}`
      );

      const searchString = JSON.stringify(search);
      if(searchString === '{}'){
        queryParams.delete(exchangeName);
      }

      if(queryParams.get(exchangeName) !== searchString){
        queryParams.set(exchangeName, searchString);
        history.push({
          pathname: history.location.pathname,
          search: queryParams.toString(),
        });
      }

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
    } catch { }
  };

  const execute = async () => {
    try {
      await fetch(`${constants.apiEvents}/reExecuteEvents`, {
        body: JSON.stringify({
          event: { ...search, exchangeName },
          force: force,
          typeOfExecute: typeOfExecute,
        }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch { }
  };

  const deleteEvents = async () => {
    try {
      await fetch(`${constants.apiEvents}/deleteEvents`, {
        body: JSON.stringify({
          ...search,
          exchangeName: exchangeName,
        }),
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      await searchData();
    } catch { }
  };

  useEffect(() => {
    searchData();
  }, []);

  const onChangeValue = (key, value) => {
    setSearch((prev) => ({
      ...prev,
      [key]: value,
    }));
  };  

  const onChangeKey = (e) => {
    setSearch((prev) => ({
      ...prev,
      [e.target.value]: '',
    }));
  };

  const onRemoveKey = (key) => {
    setSearch((prev) => {
      delete prev[key];
      return { ...prev };
    });
  };

  const renderCellContent = () => {
    if (!cellData?.value) return null;

    const value = String(cellData.value).trim();

    if (value.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
      return (
        <img
          src={`${constants.urlData}/${value}`}
          alt="cell content"
          style={{ maxWidth: "100%", maxHeight: "500px" }}
        />
      );
    }

    // PDFs
    if (value.match(/\.pdf$/i)) {
      return (
        <iframe
          src={value.includes('http') ? value : `${constants.urlData}/${value}`}
          width="100%"
          height="500px"
          style={{ border: "none" }}
          title="PDF Viewer"
        />
      );
    }

    if (value.match(/\.json$/i)) {
      return <JsonPreview file={value} />;
    }
  };


  return (
    <div>
      <SimpleSelect
        name="Instituciones"
        datas={columns.map((columns) => columns.field)}
        onChange={(e) => onChangeKey(e)}
      />
      <div className={EventsCss.inputs}>
        <div className={EventsCss.filters}>
          {
            Object.keys(search).map((key, index) =>
              <div>
                <InputText label={key} key={index} onChangeSearch={(e) => onChangeValue(key, e.target.value)} name={key} value={search[key]} />
                <Button sx={{
                  height: 55
                }} variant="contained" color="error" height="10px" onClick={() => onRemoveKey(key)}>Eliminar</Button>
              </div>
            )
          }
        </div>
        <div className={EventsCss.buttons}>
          <Button onClick={searchData}>Buscar</Button>
          <Button onClick={() => setOpenExecuteModal(true)}>Ejecutar</Button>
          <Button onClick={deleteEvents}>Eliminar</Button>
        </div>
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

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
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
      <Dialog
        open={openExecuteModal}
        onClose={() => setOpenExecuteModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Type of execute</DialogTitle>
        <DialogContent>
          <Box display="flex">
            <FormControlLabel control={<Checkbox checked={force} onChange={(e) => setForce(e.target.checked)} />} label="Force" />
            <RadioGroup
              defaultValue="completeExecution"
              row
              aria-labelledby="demo-controlled-radio-buttons-group"
              name="controlled-radio-buttons-group"
            >
              <FormControlLabel value="onlyOne" control={<Radio onChange={(e) => setTypeOfExecute(e.target.value)} />} label="Only one" />
              <FormControlLabel value="onlyOneAndNext" control={<Radio onChange={(e) => setTypeOfExecute(e.target.value)} />} label="Only one and next" />
              <FormControlLabel value="completeExecution" control={<Radio onChange={(e) => setTypeOfExecute(e.target.value)} />} label="Complete execution" />
            </RadioGroup>
          </Box>
          <Box display="flex" justifyContent="flex-end">
            <Button variant="contained" onClick={execute} >Execute</Button>
          </Box>

        </DialogContent>
      </Dialog>
    </div>
  );
}
