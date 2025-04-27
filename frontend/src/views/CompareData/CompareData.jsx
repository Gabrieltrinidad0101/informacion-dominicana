import { DataGrid } from "@mui/x-data-grid";
import { Box, Button, TextField, Typography } from "@mui/material";
import compareData from "./compareData.module.css";
import { useEffect, useState } from "react";
const columns = [
  { field: "name", headerName: "Nombre", flex: 1 },
  { field: "Position", headerName: "Posición", flex: 1 },
  { field: "Income", headerName: "Sueldo", type: "number", flex: 1 },
  { field: "SEX", headerName: "Género", flex: 1 },
  {
    field: "action",
    headerName: "Acciones",
    width: 150,
    renderCell: (params) => (
      <Button variant="contained" color="primary">
        Ver
      </Button>
    ),
  },
];
let data = [];
export function CompareData() {
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
        Object.values(value).some((value) => value.toString().toLowerCase().includes(text.toString().toLowerCase()))
      )
    );
  };

  return (
    <>
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
      <div className={compareData.comparar}>
        <embed
          src="http://localhost:5500/dataPreprocessing/townHalls/Jarabacoa/downloadData/2018/april.pdf"
          width="100%"
          height="100%"
          type="application/pdf"
        />
        <div>
          <Box sx={{ height: "92%", width: "100%" }}>
            <DataGrid
              rows={rowsToDisplay}
              columns={columns}
              getRowId={(row) => row.id}
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
        </div>
      </div>
    </>
  );
}
