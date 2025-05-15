import * as React from "react";
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
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import { useCompareModal } from "../../context/context";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "#121212",
  color: "#ffffff",
  border: "1px solid #333",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const dummyData = [
  "Apple",
  "Banana",
  "Orange",
  "Grapes",
  "Pineapple",
  "Strawberry",
  "Watermelon",
  "Kiwi",
  "Mango",
  "Peach",
  "Lemon",
  "Lime",
  "Blueberry",
  "Cherry",
  "Papaya",
  "Guava",
  "Raspberry",
];

export function CompareCharts() {
  const { isCompareModalOpen, closeCompareModal } = useCompareModal();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [checkedItems, setCheckedItems] = React.useState([]);

  const filteredData = React.useMemo(() => {
    return dummyData.filter((item) =>
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleToggle = (item) => {
    setCheckedItems((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };

  const handleCompare = () => {
    console.log("Comparing items:", checkedItems);
  };

  return (
    <div>
      {isCompareModalOpen && (
        <Modal
          aria-labelledby="transition-modal-title"
          aria-describedby="transition-modal-description"
          open={isCompareModalOpen}
          onClose={closeCompareModal}
          closeAfterTransition
          slots={{ backdrop: Backdrop }}
          slotProps={{
            backdrop: {
              timeout: 500,
            },
          }}
        >
          <Fade in={isCompareModalOpen}>
            <Box sx={style}>
              <Typography
                id="transition-modal-title"
                variant="h6"
                component="h2"
              >
                Compare Charts
              </Typography>
              <TextField
                fullWidth
                label="Search"
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
                }}
              >
                {filteredData.map((item) => (
                  <ListItem
                    key={item}
                    button
                    onClick={() => handleToggle(item)}
                    sx={{
                      color: "#fff",
                      "&:hover": { backgroundColor: "#1e1e1e" },
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={checkedItems.includes(item)}
                        tabIndex={-1}
                        disableRipple
                        sx={{
                          color: "#bbb",
                          "&.Mui-checked": {
                            color: "#fff",
                          },
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={item} />
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
                disabled={checkedItems.length === 0}
              >
                Compare Selected
              </Button>
            </Box>
          </Fade>
        </Modal>
      )}
    </div>
  );
}
