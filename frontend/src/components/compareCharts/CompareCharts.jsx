import { useState, useMemo } from "react";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Radio from "@mui/material/Radio";
import Button from "@mui/material/Button";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "50%",
  bgcolor: "#121212",
  color: "#ffffff",
  border: "1px solid #333",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const dummyData = [
  { text: "Nomina - Ayuntamiento de Moca", url: "datas/townHalls/Moca/Nomina" },
  {
    text: "Cantidad Total de Empleados - Ayuntamiento de Moca ",
    url: "datas/townHalls/Moca/Cantidad Total de Empleados",
  },
  {
    text: "Cantidad Total de Empleados Masculinos - Ayuntamiento de Moca ",
    url: "datas/townHalls/Moca/Cantidad Total de Empleados Masculinos",
  },
  {
    text: "Cantidad Total de Empleados Femeninos - Ayuntamiento de Moca ",
    url: "datas/townHalls/Moca/Cantidad Total de Empleados Femeninos",
  },
  {
    text: "Cantidad Total de Empleados - Ayuntamiento de Jarabacoa ",
    url: "datas/townHalls/Jarabacoa/Cantidad Total de Empleados",
  },
  {
    text: "Cantidad Total de Empleados Masculinos - Ayuntamiento de Jarabacoa ",
    url: "datas/townHalls/Jarabacoa/Cantidad Total de Empleados Masculinos",
  },
  {
    text: "Cantidad Total de Empleados Femeninos - Ayuntamiento de Jarabacoa ",
    url: "datas/townHalls/Jarabacoa/Cantidad Total de Empleados Femeninos",
  },
  {
    text: "Nomina - Ayuntamiento de Jarabacoa ",
    url: "datas/townHalls/Jarabacoa/Nomina",
  },
];

export function CompareCharts({
  open,
  setOpen,
  addNewChart
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const filteredData = useMemo(() => {
    return dummyData.filter((item) =>
      item.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleSelect = (item) => {
    setSelectedItems(item);
  };

  const handleCompare = () => {
    addNewChart(selectedItems.url);
  };

  return (
    <div>
      {open && (
        <Modal
          aria-labelledby="transition-modal-title"
          aria-describedby="transition-modal-description"
          open={open}
          onClose={() => setOpen(false)}
          closeAfterTransition
          slots={{ backdrop: Backdrop }}
          slotProps={{
            backdrop: {
              timeout: 500,
            },
          }}
        >
          <Fade in={open}>
            <Box sx={style}>
              <Typography
                id="transition-modal-title"
                variant="h6"
                component="h2"
              >
                Comparar Gráficas
              </Typography>
              <TextField
                fullWidth
                label="Buscar"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  mt: 2,
                  mb: 2,
                  input: { color: "#fff" },
                  label: { color: "#bbb" },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#555",
                    },
                    "&:hover fieldset": {
                      borderColor: "#777",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#fff",
                    },
                  },
                }}
              />
              <List
                sx={{
                  maxHeight: 300,
                  overflowY: "auto",
                  bgcolor: "#121212",
                  border: "1px solid #333",
                  borderRadius: 1,
                  p: 0,
                }}
              >
                {filteredData.map((item) => (
                  <ListItem
                    key={item.text}
                    button
                    onClick={() => handleSelect(item)}
                    sx={{
                      color: "#fff",
                      py: 1,
                      "&:hover": { backgroundColor: "#1e1e1e" },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Radio
                        checked={selectedItems?.text === item.text}
                        value={item.text}
                        sx={{
                          color: "#bbb",
                          "&.Mui-checked": {
                            color: "#fff",
                          },
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItem>
                ))}
                {filteredData.length === 0 && (
                  <Typography
                    sx={{ color: "#bbb", textAlign: "center", mt: 2 }}
                  >
                    No results found.
                  </Typography>
                )}
              </List>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2, bgcolor: "#333", "&:hover": { bgcolor: "#555" } }}
                onClick={handleCompare}
                disabled={!selectedItems}
              >
                Listo
              </Button>
            </Box>
          </Fade>
        </Modal>
      )}
    </div>
  );
}
