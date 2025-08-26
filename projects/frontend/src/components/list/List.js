import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Collapse from '@mui/material/Collapse';
import { useEffect, useState } from 'react';
import { Box, Button, createTheme, Fade, Modal, TextField, ThemeProvider, Typography, Backdrop } from '@mui/material';
import { formatYYMM, requestJson } from '../../utils/request';
import ListCss from './List.module.css';
import { formattedMoney } from '../../utils/format';
import { ShowImage } from '../showImage/ShowImage';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

let positionBySalary = {};

const getSalary = (position) =>
  positionBySalary[position]?.reduce((acc, row) => acc + parseInt(row.income), 0) / (positionBySalary[position]?.length ?? 1);

const getSalaryFormat = (position) => formattedMoney(getSalary(position));

const monthNames = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];


// Component for each position
export const PositionAndSalary = ({ position, employees, showImage }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ListItemButton onClick={() => setOpen(prev => !prev)}>
        <Box display="flex" justifyContent="space-between" width="100%">
          <Typography>{position}</Typography>
          <Typography>{getSalaryFormat(position)}</Typography>
          <Typography>{employees.length}</Typography>
        </Box>
        <Box ml={3}>{open ? <i>⬆️</i> : <i>⬇️</i>}</Box>
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {employees.map((employee, i) => (
            <ListItemButton key={i}>
              <Box display="flex" justifyContent="space-between" width="100%">
                <Typography variant="body1" sx={{ fontSize: '10px', m: 0, p: 0 }}>{employee.name}</Typography>
                <Typography variant="body1" sx={{ fontSize: '10px', m: 0, p: 0 }}>{formattedMoney(employee.income)}</Typography>
                <Button variant="text" onClick={() => showImage(employee)} sx={{ fontSize: '10px', m: 0, p: 0 }}>Ver fuente</Button>
              </Box>
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </>
  );
};

const lightTheme = {
  mb: 2,
  backgroundColor: "white",
  "& .MuiOutlinedInput-root": {
    backgroundColor: "white",
    "& fieldset": { borderColor: "#ccc" },
    "&:hover fieldset": { borderColor: "#007bff" },
    "&.Mui-focused fieldset": { borderColor: "#007bff" },
  },
  "& .MuiInputBase-input": { color: "#333" },
};

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  maxWidth: '1000px',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
};

export const ListGroup = ({ title,currentDate,setCurrentDate, url }) => {
  const [search, setSearch] = useState("");
  const [employee, setEmployee] = useState({});
  const [positions, setPositions] = useState([]);
  const [open, setOpen] = useState(false);
  const [allowedMonths, setAllowedMonths] = useState(new Set());

  const darkTheme = createTheme({ palette: { mode: 'dark' } });

  const handleDate = async (date) => {
    setCurrentDate(date);
    const data = await requestJson(`${url}exportToJson/employeersByPosition${formatYYMM(date)}`);
    positionBySalary = data;
    setPositions(Object.keys(positionBySalary));
  };

  useEffect(() => {
    requestJson(`${url}exportToJson/header`).then((data) => {
      const dates = new Set(
        data.map(v => v.replace(/[^0-9-]/g, ""))
      );
      setAllowedMonths(dates);
      const [year,month] = data.at(-1).split("-")
      handleDate(new Date(year, month, 0));
    })
  }, []);

  const onChangeSearch = (e) => {
    const text = e.target.value;
    setSearch(text);
    if (!text) return setPositions(Object.keys(positionBySalary));
    setPositions(prev =>
      prev.filter(value =>
        value.toLowerCase().includes(text.toLowerCase())
      )
    );
  };

  const showImage = (employee) => {
    setEmployee(employee);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const shouldDisableMonth = (month) => {
    const key = month.format("YYYY-MM");
    return !allowedMonths.has(key);
  };

  const monthName = monthNames[currentDate?.getMonth() ?? ""];

  return (
    <>
     {currentDate && <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={open}>
          <Box sx={style}>
            <ShowImage
              url={`http://localhost:5500/data/${url}postDownloads/${currentDate.getFullYear()}/${monthName}/_.${(employee).index}.jpg`}
              employee={employee}
            />
          </Box>
        </Fade>
      </Modal>}

      <h1>{title}</h1>

      <div className={ListCss.inputs}>
        <TextField
          fullWidth
          label="Buscar"
          variant="filled"
          value={search}
          onChange={onChangeSearch}
          sx={lightTheme}
        />

        <div className={ListCss.icon}>
          <ThemeProvider theme={darkTheme}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                views={['month', 'year']}
                value={dayjs(currentDate)}
                onChange={(newValue) => {
                  if (!newValue) return;
                  const jsDate = newValue.toDate();
                  handleDate(jsDate);
                }}
                shouldDisableMonth={shouldDisableMonth}
              />
            </LocalizationProvider>
          </ThemeProvider>
        </div>
      </div>

      <List
        className={ListCss.list}
        sx={{ bgcolor: '#fff', color: '#000', borderRadius: 2, p: 1 }}
        component="nav"
        aria-labelledby="nested-list-subheader"
        subheader={
          <ListSubheader component="div" id="nested-list-subheader">
            <Box display="flex" justifyContent="space-between" width="calc(100% - 48px)">
              <Typography>Posición</Typography>
              <Typography>Salario</Typography>
              <Typography>Cantidad</Typography>
            </Box>
          </ListSubheader>
        }
      >
        <div className={ListCss.scrollbar}>
          {positions.sort((a, b) => getSalary(b) - getSalary(a)).map((position, index) => (
            <PositionAndSalary
              key={index}
              position={position}
              employees={positionBySalary[position]}
              showImage={showImage}
            />
          ))}
        </div>
      </List>
    </>
  );
};
