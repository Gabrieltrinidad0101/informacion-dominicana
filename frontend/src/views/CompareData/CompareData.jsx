import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import compareData from "./compareData.module.css";
import { useEffect, useRef, useState } from "react";
import { Pagination } from "@mui/material";

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

const formatted = (number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(number);

export function CompareData() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [dates, setDates] = useState([]);
  const [currentDate, setCurrentDate] = useState("");
  const [page, setPage] = useState(1);
  const selectEmployee = useRef(null);
  const imageRef = useRef(null);

  const handleClick = (row) => {
    const element = selectEmployee.current;
    const image = imageRef.current.getBoundingClientRect();

    const porX = (row.x / 2000) * 100;
    const porY = (row.y / 2000) * 100;
    const porHeight = (row.height / 2000) * 100;
    const porWidth = (row.width / 2000) * 100;

    const positionX = image.width * (porX / 100);
    const positionY = image.height * (porY / 100);
    const width = image.width * (porWidth / 100);
    const height = image.height * (porHeight / 100);

    element.style.left = `${positionX}px`;
    element.style.top = `${positionY}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    selectEmployee.current.classList.remove(compareData.selecteEmployeeOpacity);
    element.classList.add(compareData.selecteEmployee);
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
    fetch("http://127.0.0.1:5500/datas/townHalls/Jarabacoa/Nomina.json")
      .then((response) => response.json())
      .then((res) => {
        setCurrentDate(res[0].time);
        setDates(res);
      });
  }, []);

  useEffect(() => {
    const employees = {};
    if ((currentDate?.length ?? 0) <= 0) return;
    const [year, month] = currentDate.split("-");
    fetch(
      `http://127.0.0.1:5500/dataPreprocessing/townHalls/Jarabacoa/data/${year}/${months[month]}.json`
    )
      .then((response) => response.json())
      .then((res) => {
        data = res.map((row) => {
          employees[row.document] ??= [];
          employees[row.document].push(row);
          row.id = crypto.randomUUID();
          return row;
        });
        setRows(data);
      });
    const rows = Object.keys(employees).filter((key) => {
      employees[key].length > 1;
    });
    console.log(rows);
  }, [currentDate]);

  useEffect(() => {
    selectEmployee.current.classList.add(compareData.selecteEmployeeOpacity);
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

  const filteredRows = rows.filter((row) => row.page == page);
  filteredRows.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
  const totalPages = Math.max(...rows.map((row) => row.page ?? 0)) ?? 0;

  const sum = (arr) =>
    arr.reduce(
      (acc, row) =>
        acc +
        parseFloat(
          (row.income || "0")?.replaceAll("$", "").replaceAll(",", "")
        ),
      0
    );

  const totalPayroll = sum(rows);
  const totalPayrollByPage = sum(filteredRows);
  const totalEmployees = rows.length;
  const totalEmployeesByPage = filteredRows.length;

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const lightTheme = {
    mb: 2,
    backgroundColor: "white",
    "& .MuiOutlinedInput-root": {
      backgroundColor: "white",
      "& fieldset": {
        borderColor: "#ccc",
      },
      "&:hover fieldset": {
        borderColor: "#007bff",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#007bff",
      },
    },
    "& .MuiInputBase-input": {
      color: "#333",
    },
  };

  const handleDate = (event) => {
    setCurrentDate(event.target.value);
  };

  return (
    <>
      <Box sx={{ mb: 2 }} className={compareData.inputs}>
        <TextField
          fullWidth
          label="Buscar"
          variant="filled"
          value={search}
          onChange={onChangeSearch}
          sx={lightTheme}
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
              src={`http://localhost:5500/dataPreprocessing/townHalls/Jarabacoa/images/${
                currentDate?.split("-")?.[0]
              }/${
                months[currentDate?.split("-")?.[1]]
              }/jarabacoaTownHall.${page}.jpg`}
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
