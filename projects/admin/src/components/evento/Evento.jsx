import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { SimpleSelect } from "../inputs/simpleSelects";
import EventsCss from "./Evento.module.css";
import { Button, Dialog, DialogTitle, DialogContent, Box, Checkbox, FormControlLabel, RadioGroup, Radio, Select, MenuItem, TextField, Chip } from "@mui/material";
import constants from "../../constants";
import { useHistory } from "react-router";
import { lightTheme } from "../../themes/light";

const OPERATORS = [
  { value: 'contains', label: 'Contiene' },
  { value: 'equals', label: 'Igual' },
  { value: 'notEquals', label: 'No igual' },
  { value: 'exists', label: 'Existe' },
  { value: 'notExists', label: 'No existe' },
  { value: 'dateRange', label: 'Rango fecha' },
]

const DATE_FIELD_PATTERN = /date/i
import { PdfViewer } from "../pdf/PdfViewer";
import { EventStatusBadges } from "./EventStatusBadges";

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

const generateUrl = (data, microService, fileName) => {
  return `${data.institutionName}/${data.typeOfData}/${microService}/${data.year}/${data.month}/${fileName}`;
};


export function Evento({ exchangeName, queryParams }) {
  const [downloadLinks, setDownloadLinks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filters, setFilters] = useState(() => {
    try {
      const exchangeFilters = JSON.parse(queryParams.get(exchangeName))
      const globalFilters = JSON.parse(localStorage.getItem('globalFilters'))
      const local = Array.isArray(exchangeFilters) ? exchangeFilters : []
      const global_ = Array.isArray(globalFilters) ? globalFilters.map(f => ({ ...f, global: true })) : []
      return [...global_, ...local]
    } catch { return [] }
  });
  const [open, setOpen] = useState(false);
  const [cellData, setCellData] = useState(null);
  const [openExecuteModal, setOpenExecuteModal] = useState(false);
  const [force, setForce] = useState(false);
  const [typeOfExecute, setTypeOfExecute] = useState('completeExecution');

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [rowCount, setRowCount] = useState(0);

  const history = useHistory();

  const searchData = async () => {
    try {
      const { page, pageSize } = paginationModel;
      const filtersJson = encodeURIComponent(JSON.stringify(filters.map(({ global: _, ...f }) => f)))
      const data = await fetch(
        `${constants.apiEvents}/find?exchangeName=${exchangeName}&page=${page}&limit=${pageSize}&filters=${filtersJson}`
      );

      const globalFilters = filters.filter(f => f.global).map(({ global: _, ...f }) => f)
      const localFilters = filters.filter(f => !f.global)

      if (globalFilters.length === 0) localStorage.removeItem('globalFilters')
      else localStorage.setItem('globalFilters', JSON.stringify(globalFilters))

      if (localFilters.length === 0) queryParams.delete(exchangeName)
      else queryParams.set(exchangeName, JSON.stringify(localFilters))

      history.push({
        pathname: history.location.pathname,
        search: queryParams.toString(),
      });

      const json = await data.json();

      let rows = [];
      if (Array.isArray(json)) {
        rows = json;
        setRowCount(json.length);
      } else if (json && json.data) {
        rows = json.data;
        setRowCount(json.total);
      }

      if (!rows || rows.length === 0) {
        setDownloadLinks([]);
        return;
      }
      const columns_ = Object.keys(rows[0])
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
      setDownloadLinks(rows);
    } catch { }
  };

  const filtersToSimpleQuery = () => {
    const query = {}
    for (const f of filters) {
      if (['contains', 'equals'].includes(f.operator) && f.value) query[f.key] = f.value
    }
    return query
  }

  const execute = async () => {
    try {
      await fetch(`${constants.apiEvents}/reExecuteEvents`, {
        body: JSON.stringify({
          event: { ...filtersToSimpleQuery(), exchangeName },
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
          ...filtersToSimpleQuery(),
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
  }, [paginationModel]);

  const addFilter = (key) => {
    if (!key) return
    setFilters(prev => [...prev, {
      key,
      operator: DATE_FIELD_PATTERN.test(key) ? 'dateRange' : 'contains',
      value: '',
      from: '',
      to: '',
      global: false,
    }])
  }

  const updateFilter = (index, changes) => {
    setFilters(prev => prev.map((f, i) => i === index ? { ...f, ...changes } : f))
  }

  const removeFilter = (index) => {
    setFilters(prev => prev.filter((_, i) => i !== index))
  }

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
        <PdfViewer url={value.includes('http') ? value : `${constants.urlData}/${value}`} />
      );
    }

    if (value.match(/\.json$/i)) {
      return <JsonPreview file={value} />;
    }
  };


  return (
    <div>
      <EventStatusBadges exchangeName={exchangeName} />
      <SimpleSelect
        name="Agregar filtro"
        datas={columns.map((col) => col.field)}
        onChange={(e) => addFilter(e.target.value)}
      />
      <div className={EventsCss.inputs}>
        <div className={EventsCss.filters}>
          {filters.map((filter, index) => (
            <div key={index} className={EventsCss.filterRow}>
              <Chip label={filter.key} size="small" className={EventsCss.filterKey} />
              <Select
                size="small"
                value={filter.operator}
                variant="filled"
                sx={{ minWidth: 140 }}
                onChange={e => updateFilter(index, { operator: e.target.value, value: '', from: '', to: '' })}
              >
                {OPERATORS.map(op => <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>)}
              </Select>
              {!['exists', 'notExists', 'dateRange'].includes(filter.operator) && (
                <TextField
                  size="small"
                  label="Valor"
                  variant="filled"
                  value={filter.value}
                  sx={{ ...lightTheme, flex: 1 }}
                  onChange={e => updateFilter(index, { value: e.target.value })}
                />
              )}
              {filter.operator === 'dateRange' && (
                <>
                  <TextField
                    size="small"
                    type="date"
                    label="Desde"
                    variant="filled"
                    value={filter.from}
                    InputLabelProps={{ shrink: true }}
                    sx={{ ...lightTheme, flex: 1 }}
                    onChange={e => updateFilter(index, { from: e.target.value })}
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="Hasta"
                    variant="filled"
                    value={filter.to}
                    InputLabelProps={{ shrink: true }}
                    sx={{ ...lightTheme, flex: 1 }}
                    onChange={e => updateFilter(index, { to: e.target.value })}
                  />
                </>
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={!!filter.global}
                    onChange={e => updateFilter(index, { global: e.target.checked })}
                  />
                }
                label="Global"
                sx={{ margin: 0 }}
              />
              <Button size="small" color="error" variant="outlined" onClick={() => removeFilter(index)}>✕</Button>
            </div>
          ))}
        </div>
        <div className={EventsCss.buttons}>
          <Button onClick={searchData}>Buscar</Button>
          <Button onClick={() => setOpenExecuteModal(true)}>Ejecutar</Button>
          <Button onClick={deleteEvents}>Delete</Button>
        </div>
      </div>

      <div style={{ height: 500, width: "100%" }}>
        <DataGrid
          rows={downloadLinks}
          pageSizeOptions={[10]}
          className={EventsCss.dataGrid}
          density="compact"
          paginationMode="server"
          rowCount={rowCount}
          onPaginationModelChange={setPaginationModel}
          paginationModel={paginationModel}
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
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(cellData?.row, null, 2)}
          </pre>
          <Box display="flex" justifyContent="space-between">
            <Button variant="contained" onClick={() => { setCellData(prev => ({ ...prev, value: prev.row['link'] })) }}>Link</Button>
            <Button variant="contained" onClick={() => { setCellData(prev => ({ ...prev, value: prev.row['urlDownload'] })) }}>Downloaded</Button>
            <Button variant="contained" onClick={() => { setCellData(prev => ({ ...prev, value: generateUrl(prev.row, 'postDownloads', `page_${prev.row.page}_img_${prev.row.imageIndex}.jpeg`) })) }}>Image</Button>
            <Button variant="contained" onClick={() => { setCellData(prev => ({ ...prev, value: generateUrl(prev.row, 'postDownloads', `page_${prev.row.page}_img_${prev.row.imageIndex}.json`) })) }}>ImageMetaData</Button>
            <Button variant="contained" onClick={() => { setCellData(prev => ({ ...prev, value: generateUrl(prev.row, 'imgProcessed', `page_${prev.row.page}_img_${prev.row.imageIndex}.png`) })) }}>imgProcessed</Button>
            <Button variant="contained" onClick={() => { setCellData(prev => ({ ...prev, value: generateUrl(prev.row, 'extractedText', `page_${prev.row.page}_img_${prev.row.imageIndex}.json`) })) }}>Text</Button>
            <Button variant="contained" onClick={() => { setCellData(prev => ({ ...prev, value: generateUrl(prev.row, 'extractedTextAnalyzer', `page_${prev.row.page}_img_${prev.row.imageIndex}.json`) })) }}>AnalyzerText</Button>
            <Button variant="contained" onClick={() => { setCellData(prev => ({ ...prev, value: generateUrl(prev.row, 'aiTextAnalyzer', `page_${prev.row.page}_img_${prev.row.imageIndex}.json`) })) }}>IA</Button>
            <Button variant="contained" onClick={() => { setCellData(prev => ({ ...prev, value: generateUrl(prev.row, 'pii', 'document.pdf') })) }}>Pii</Button>
          </Box>
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
