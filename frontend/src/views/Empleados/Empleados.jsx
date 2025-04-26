import { DataGrid } from "@mui/x-data-grid";
import { Box, Button, TextField, Typography } from "@mui/material";
import compareData from "./compareData.module.css";
import { useEffect, useState } from "react";
const columns = [
  { field: "id", headerName: "ID", flex: 1, hideable: true },
  { field: "name", headerName: "Nombre", flex: 1 },
  { field: "Position", headerName: "Posición", flex: 1 },
  { field: "Income", headerName: "Sueldo", type: "number", flex: 1 },
  { field: "SEX", headerName: "Género", width: 10 },
  { field: "deparment", headerName: "Departamento", flex: 1 },
];
let data = [];
export function Empleados() {
  const [rowsToDisplay, setRowsToDisplay] = useState([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    fetch(
      "http://127.0.0.1:5500/dataPreprocessing/townHalls/Jarabacoa/data/2018/april.json"
    )
      .then((response) => response.json())
      .then((res) => {
        data = res.map((row) => {
          row.id = crypto.randomUUID();
          row.deparment = "ayuntamiento de jarabacoa"
          return row;
        });
        setRowsToDisplay(data);
      });
  }, []);

  const totalSalary = rowsToDisplay.reduce((acc, row) => {
    const number = parseFloat(
      (row.Income || "0")?.replaceAll("$", "").replaceAll(",", "")
    );
    return acc + number;
  }, 0);

  const totalEmployees = rowsToDisplay.length;

  const onChangeSearch = (e) => {
    const text = e.target.value;
    setSearch(text);
    if (text === "") return setRowsToDisplay(data);
    setRowsToDisplay((prevValue) =>
      prevValue.filter((value) =>
        Object.values(value).some((value) => value.toLowerCase().includes(text.toLowerCase()))
      )
    );
  };

  return (
    <>
      <h6>Por el momento solo tengo los datos de jarabacoa estoy trabajando en agregar mas</h6>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Buscar"
          variant="filled"
          value={search}
          onChange={onChangeSearch}
          sx={{
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
          }}
        />
      </Box>
          <Box sx={{ height: "92%", width: "100%" }}>
            <DataGrid
              rows={rowsToDisplay}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              pageSizeOptions={[5, 30]}
            />
          </Box>
          <div className={compareData.footerTable}>
            <Typography variant="h6">
              Sueldo Total: ${totalSalary.toLocaleString()}
            </Typography>
            <Typography variant="h6">Empleados: {totalEmployees}</Typography>
          </div>
    </>
  );
}
