import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import compareData from "./compareData.module.css";
import { useEffect, useRef, useState } from "react";
import { Pagination } from "@mui/material";
import { formattedMoney } from "../../utils/format";
import { formatYYMM, requestJson } from "../../utils/request";
import { InputText } from "../../components/inputs/inputText";
import { SimpleSelect } from "../../components/inputs/simpleSelects";
import { lightTheme } from "../../themes/light";
import { ShowImage } from "../../components/showImage/ShowImage";
import { useLocation, useHistory } from "react-router-dom";
let data = [];

const institutions = ["Ayuntamiento de Jarabacoa", "Ayuntamiento de Moca"];

export function CompareData() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const history = useHistory();

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [firstLoad, setFirstLoad] = useState(true);
  const [dates, setDates] = useState([]);
  const [currentDate, setCurrentDate] = useState(queryParams.get("date") ?? '');
  const [index, setIndex] = useState(1);
  const [employee, setEmployee] = useState({ index: 1 });
  const selectEmployee = useRef(null);
  const [institution, setinstitution] = useState(
    queryParams.get("institution") ?? institutions[0]
  );

  const handleClick = (employee) => {
    setEmployee(employee);
  };

  const columns = [
    { field: "name", headerName: "Nombre", flex: 1 },
    { field: "position", headerName: "Posición", flex: 1 },
    {
      field: "income",
      headerName: "Sueldo",
      type: "number",
      flex: 1,
      renderCell: ({ row }) => {
        return row.income ? formattedMoney(row.income) : "";
      },
    },
    { field: "sex", headerName: "Género", flex: 1 },
    { field: "index", headerName: "Página", flex: 1, hide: true },
    {
      field: "action",
      headerName: "Acciones",
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleClick(params.row)}
        >
          Ver
        </Button>
      ),
    },
  ];

  useEffect(() => {
    requestJson(`${institution}/nomina/exportToJson/payroll`).then((res) => {
      setDates(res);
      setFirstLoad(false)
      if(firstLoad && currentDate) return
      setCurrentDate(res[0].time);
      queryParams.set("date", res[0].time);
      history.push({ search: queryParams.toString() });
    });
  }, [institution]);

  useEffect(() => {
    if ((currentDate?.length ?? 0) <= 0) return;
    requestJson(
      `${institution}/nomina/exportToJson/employeersByPosition${formatYYMM(
        new Date(currentDate)
      )}`
    ).then((res) => {
      data = Object.values(res).flat();
      setRows(data);
    });
  }, [currentDate]);

  const onChangeSearch = (e) => {
    const text = e.target.value;
    setSearch(text);
    if (text === "") return setRows(data);
    setRows((prevValue) =>
      prevValue.filter((value) =>
        Object.values(value).some((value) =>
          value.toString().toLowerCase().includes(text.toString().toLowerCase())
        )
      )
    );
  };

  const filteredRows =
    search !== "" ? [...rows] : rows.filter((row) => row.index == index);
  if (search === "") filteredRows.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
  const totalPages =
    search !== ""
      ? Math.floor(filteredRows.length / 15)
      : Math.max(...rows.map((row) => row.index ?? 0)) ?? 0;
  const sum = (arr) =>
    arr.reduce((acc, row) => acc + parseFloat(row.income || "0") || 0, 0);

  const totalPayroll = sum(rows);
  const totalPayrollByPage = sum(filteredRows);
  const totalEmployees = rows.length;
  const totalEmployeesByPage = filteredRows.length;

  const handlePageChange = (event, newPage) => {
    setIndex(newPage);
    if (search !== "") return;
    setEmployee({ index: newPage });
  };

  const handleDate = (event) => {
    setCurrentDate(event.target.value);
    queryParams.set("date", event.target.value);
    history.push({ search: queryParams.toString() });
  };

  const handleTownHall = (event) => {
    queryParams.set("institution", event.target.value);
    history.push({ search: queryParams.toString() });
    setinstitution(event.target.value);
    setIndex(1);
    setEmployee({ index: 1 });
  };

  return (
    <>
      <Box sx={{ mb: 2 }} className={compareData.inputs}>
        <InputText
          label="Buscar"
          search={search}
          onChangeSearch={onChangeSearch}
        />
        <SimpleSelect
          name="Ayuntamientos"
          datas={institutions}
          onChange={handleTownHall}
          value={institution}
        />
        <FormControl variant="filled" sx={lightTheme}>
          <InputLabel id="demo-simple-select-filled-label">Fecha</InputLabel>
          {currentDate && (
            <Select
              value={currentDate}
              onChange={handleDate}
              labelId="demo-simple-select-filled-label"
              id="demo-simple-select-filled"
            >
              {dates.map((header, index) => {
                const [year, month, day] = header.time.split("-");
                return (
                  <MenuItem key={index} value={header.time}>
                    {year} - {month} - {day}
                  </MenuItem>
                );
              })}
            </Select>
          )}
        </FormControl>
      </Box>
      <div className={compareData.comparar}>
        <div className={compareData.overflowImage}>
          <div>
            {currentDate && employee && (
              <ShowImage
                institution={institution}
                currentDate={new Date(currentDate)}
                employee={employee}
              />
            )}
          </div>
        </div>
        <div className={compareData.selecteEmployee} ref={selectEmployee}></div>
        <div className={compareData.bgWhite}>
          <Box sx={{ height: "92%", width: "100%" }}>
            <div style={{ width: "100%" }}>
              <div style={{ height: 700, overflow: "auto" }}>
                <DataGrid
                  rows={filteredRows}
                  columns={columns}
                  pageSize={filteredRows.length}
                  rowsPerPageOptions={[filteredRows.length]}
                  columnVisibilityModel={{
                    page: search !== "",
                  }}
                  disableSelectionOnClick
                  hideFooterPagination
                  hideFooter
                  sx={{
                    backgroundColor: "white",
                    borderRadius: 2,
                    boxShadow: 2,
                  }}
                />
              </div>

              <Pagination
                count={totalPages}
                page={index}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                sx={{ mt: 2, display: "flex", justifyContent: "center" }}
              />
            </div>
          </Box>
          <div className={compareData.footerTable}>
            <Typography variant="h6">
              Nomina Total: {formattedMoney(totalPayroll)}
            </Typography>
            <Typography variant="h6">Empleados: {totalEmployees}</Typography>
            <Typography variant="h6">
              Nomina de la pagina: {formattedMoney(totalPayrollByPage)}
            </Typography>
            <Typography variant="h6">
              Empleados de la pagina: {totalEmployeesByPage}
            </Typography>
          </div>
        </div>
      </div>
    </>
  );
}
