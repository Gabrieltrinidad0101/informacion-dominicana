import { DataGrid } from "@mui/x-data-grid";
import { Box, Button, TextField, Typography } from "@mui/material";
import compareData from "./compareData.module.css";
import { useEffect, useState } from "react";
import { Pagination } from "@mui/material";

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
  const [rows, setRows] = useState([]);
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
        setRows(data);
      });
  }, []);

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

  const [page, setPage] = useState(1); // Start at page 1
  const filteredRows = rows.filter((row) => row.page === page);
  const totalPages = Math.max(...rows.map((row) => row.page)); // max page number
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const containerHeight = 700;

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
        <img
          src={`http://localhost:5500/dataPreprocessing/townHalls/Jarabacoa/images/2018/april/jarabacoaTownHall.${page}.jpg`}
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
    </>
  );
}
