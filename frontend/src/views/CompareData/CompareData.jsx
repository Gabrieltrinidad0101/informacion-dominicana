import { DataGrid } from "@mui/x-data-grid";
import { Box, Button, TextField, Typography } from "@mui/material";
import compareData from "./compareData.module.css";
import { useEffect,useState } from "react";
const columns = [
  { field: "id", headerName: "ID", flex: 1,hide: true },
  { field: "name", headerName: "Nombre", flex: 1 },
  { field: "Position", headerName: "Posición", flex: 1 },
  { field: "Income", headerName: "Sueldo", type: "number", flex: 1 },
  { field: "SEX", headerName: "Género", flex: 1 },
  {
    field: "action",
    headerName: "Acciones",
    width: 150,
    renderCell: (params) => (
      <Button
        variant="contained"
        color="primary"
      >
        Ver
      </Button>
    ),
  },
];

export function CompareData() {
  const [rowsToDisplay, setRowsToDisplay] = useState([]);

  useEffect(() => {
    fetch(
      "http://127.0.0.1:5500/dataPreprocessing/townHalls/Jarabacoa/data/2018/april.json"
    )
      .then((response) => response.json())
      .then((data) => {
        data = data.map((row) => {row.id = crypto.randomUUID(); return row;});
        setRowsToDisplay(data);
      });
  }, []);

  const totalSueldo = rowsToDisplay.reduce((acc, row) => acc + parseFloat((row.Income ?? "0")?.replaceAll("$","").replaceAll(",","")), 0);

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Buscar"
          variant="filled"
          sx={{
            mb: 2,
            backgroundColor: "white", // Set background to white
            "& .MuiOutlinedInput-root": {
              backgroundColor: "white", // Ensure the input background is white
              "& fieldset": {
                borderColor: "#ccc", // Set the border color
              },
              "&:hover fieldset": {
                borderColor: "#007bff", // Change border color on hover
              },
              "&.Mui-focused fieldset": {
                borderColor: "#007bff", // Focused state border color
              },
            },
            "& .MuiInputBase-input": {
              color: "#333", // Text color inside the input field
            },
          }}
        />
      </Box>
      <div class={compareData.comparar}>
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
              pageSize={25}
              initialState
            />
          </Box>

          <Box sx={{ mt: 2, p: 2, textAlign: "right" }}>
            <Typography variant="h6">
              Total Sueldo: ${totalSueldo.toLocaleString()}
            </Typography>
          </Box>
        </div>
      </div>
    </>
  );
}
