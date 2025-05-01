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

export function CompareData() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [dates, setDates] = useState([]);
  const [currentDate, setCurrentDate] = useState("");
  const [page, setPage] = useState(0); // Start at page 1
  const selectEmployee = useRef(null);
  const imageRef = useRef(null);
  const handleClick = (row) => {
    const element = selectEmployee.current
    const image = imageRef.current.getBoundingClientRect()
    
    const porX = (row.x/2000) * 100  
    const porY = (row.y/2000) * 100 
    const porHeight = (row.height/2000) * 100  
    const porWidth = (row.width/2000) * 100

    const positionX = image.width*(porX/100)
    const positionY = image.height*(porY/100)
    const width = image.width*(porWidth/100)
    const height = image.height*(porHeight/100)


    element.style.left = `${image.x + positionX}px`;
    element.style.top = `${image.y + positionY}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
  };

  const columns = [
    { field: "name", headerName: "Nombre", flex: 1 },
    { field: "position", headerName: "Posición", flex: 1 },
    { field: "income", headerName: "Sueldo", type: "number", flex: 1 },
    { field: "sex", headerName: "Género", flex: 1 },
    {
      field: "action",
      headerName: "Acciones",
      width: 150,
      renderCell: (params) => (
        <Button variant="contained" color="primary" onClick={()=>handleClick(params.row)}>
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
    if ((currentDate?.length ?? 0) <= 0) return;
    const [year, month] = currentDate.split("-");
    fetch(
      `http://127.0.0.1:5500/dataPreprocessing/townHalls/Jarabacoa/data/${year}/${months[month]}.json`
    )
      .then((response) => response.json())
      .then((res) => {
        data = res.map((row) => {
          row.id = crypto.randomUUID();
          return row;
        });
        setRows(data);
      });
  }, [currentDate]);

  const totalSalary = rows.reduce((acc, row) => {
    const number = parseFloat(
      (row.Income || "0")?.replaceAll("$", "").replaceAll(",", "")
    );
    return acc + number;
  }, 0);

  const totalEmployees = rows.length;

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
  const totalPages = Math.max(...rows.map((row) => row.page ?? 0)) ?? 0; // max page number
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const containerHeight = 700;

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
    console.log(event.target.value);
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
        <img
          ref={imageRef}
          src={`http://localhost:5500/dataPreprocessing/townHalls/Jarabacoa/images/${
            currentDate?.split("-")?.[0]
          }/${
            months[currentDate?.split("-")?.[1]]
          }/jarabacoaTownHall.${page+1}.jpg`}
          width="100%"
          height="100%"
        />
        <div className={compareData.bgWhite}>
          <Box sx={{ height: "92%", width: "100%" }}>
            <div style={{ width: "100%" }}>
              <div style={{ height: containerHeight, overflow: "auto" }}>
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
              Sueldo Total: ${totalSalary.toLocaleString()}
            </Typography>
            <Typography variant="h6">Empleados: {totalEmployees}</Typography>
          </div>
        </div>
      </div>
      <div className={compareData.selecteEmployee} ref={selectEmployee}></div>
    </>
  );
}
