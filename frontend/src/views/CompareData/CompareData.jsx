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
import { formatted } from "../../utils/format";
import { payroll, requestJson } from "../../utils/request";
import { positionSelect } from "../../utils/positionSelect";
import positionSelectCss from "../../utils/positionSelect.module.css";
import { InputText } from "../../components/inputs/inputText";
import { SimpleSelect } from "../../components/inputs/simpleSelects";
import { lightTheme } from "../../themes/light";

let data = [];
const months = {
  "01": "january",
  "02": "february",
  "03": "march",
  "04": "april",
  "05": "may",
  "06": "june",
  "07": "july",
  "08": "august",
  "09": "september",
  10: "october",
  11: "november",
  12: "december",
};

const townHalls = ["Jarabacoa", "Moca"];

export function CompareData() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [dates, setDates] = useState([]);
  const [currentDate, setCurrentDate] = useState("");
  const [page, setPage] = useState(1);
  const [imagePage, setImagePage] = useState(1);
  const selectEmployee = useRef(null);
  const imageRef = useRef(null);
  const [townHall, setTownHall] = useState(townHalls[0]);

  const handleClick = (employee) => {
    positionSelect(selectEmployee, imageRef, employee);
    setImagePage(employee.page);
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
        return row.income ? formatted(row.income) : "";
      },
    },
    { field: "sex", headerName: "Género", flex: 1 },
    { field: "page", headerName: "Página", flex: 1, hide: true },
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
    payroll(townHall).then((res) => {
      setCurrentDate(res[0].time);
      setDates(res);
    });
  }, [townHall]);

  useEffect(() => {
    if ((currentDate?.length ?? 0) <= 0) return;
    const [year, month] = currentDate.split("-");
    requestJson(
      `/dataPreprocessing/townHalls/${townHall}/data/${year}/${months[month]}`
    ).then((res) => {
      data = res.map((row) => {
        row.id = crypto.randomUUID();
        return row;
      });
      setRows(data);
    });
  }, [currentDate]);

  useEffect(() => {
    selectEmployee.current.classList.add(
      positionSelectCss.selecteEmployeeOpacity
    );
  }, [page, currentDate]);

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
    search !== "" ? [...rows] : rows.filter((row) => row.page == page);
  if(search === "") filteredRows.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
  const totalPages =
    search !== ""
      ? Math.floor(filteredRows.length / 15)
      : Math.max(...rows.map((row) => row.page ?? 0)) ?? 0;
  const sum = (arr) =>
    arr.reduce((acc, row) => acc + parseFloat(row.income || "0") || 0, 0);

  const totalPayroll = sum(rows);
  const totalPayrollByPage = sum(filteredRows);
  const totalEmployees = rows.length;
  const totalEmployeesByPage = filteredRows.length;

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    if(search !== "") return;
    setImagePage(newPage);
  };

  const handleDate = (event) => {
    setCurrentDate(event.target.value);
  };

  const handleTownHall = (event) => {
    setTownHall(event.target.value);
    setPage(1);
    setImagePage(1);
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
          datas={townHalls}
          onChange={handleTownHall}
          value={townHall}
        />
        <FormControl variant="filled" sx={lightTheme}>
          <InputLabel id="demo-simple-select-filled-label">Fecha</InputLabel>
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
        </FormControl>
      </Box>
      <div className={compareData.comparar}>
        <div className={compareData.overflowImage}>
          <div>
            <img
              style={{
                transform: `rotate(-${filteredRows?.[0]?.pageAngle ?? 0}deg)`,
              }}
              ref={imageRef}
              src={`http://localhost:5500/dataPreprocessing/townHalls/${townHall}/images/${
                currentDate?.split("-")?.[0]
              }/${
                months[currentDate?.split("-")?.[1]]
              }/_${imagePage}.jpg`}
              width="100%"
              height="100%"
            />
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
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                sx={{ mt: 2, display: "flex", justifyContent: "center" }}
              />
            </div>
          </Box>
          <div className={compareData.footerTable}>
            <Typography variant="h6">
              Nomina Total: {formatted(totalPayroll)}
            </Typography>
            <Typography variant="h6">Empleados: {totalEmployees}</Typography>
            <Typography variant="h6">
              Nomina de la pagina: {formatted(totalPayrollByPage)}
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
