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
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: "1000px",
  bgcolor: "#121212",
  color: "#ffffff",
  border: "1px solid #333",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const compareCharts = ["Ayuntamiento de Jarabacoa", "Ayuntamiento de Moca"].map(
  (institution) => [
    {
      text: `Nomina - ${institution}`,
      url: `${institution}/nomina/exportToJson/payroll`,
    },
    {
      text: `Cantidad Total de Empleados - ${institution}`,
      url: `${institution}/nomina/exportToJson/employeersTotal`,
    },
    {
      text: `Cantidad Total de Empleados Masculinos - ${institution}`,
      url: `${institution}/nomina/exportToJson/employeersF`,
    },
    {
      text: `Cantidad Total de Empleados Femeninos - ${institution}`,
      url: `${institution}/nomina/exportToJson/employeersF`,
    },
  ]
).flat();

export function CompareCharts({
  open,
  setOpen,
  addNewChart,
  include,
  notInclude,
}) {
  const [dummyData] = useState(
    compareCharts.filter(
      (data) => data.text.includes(include) && !data.text.includes(notInclude)
    )
  );
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
    setOpen(false);
  };

  return (
    <>
      {open && (
        <Modal
          aria-labelledby="transition-modal-title"
          aria-describedby="transition-modal-description"
          open={open}
          style={{ position: "fixed" }}
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
    </>
  );
}
