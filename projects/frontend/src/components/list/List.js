import React, { useEffect, useState, useMemo } from 'react';
import { Box, Button, createTheme, Fade, Modal, TextField, ThemeProvider, Typography, Backdrop } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
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
  positionBySalary[position]?.reduce(
    (acc, row) =>
      acc +
      (Number.isNaN(parseInt(row.income)) ? 0 : parseInt(row.income)),
    0
  ) / (positionBySalary[position]?.length ?? 1);

const getSalaryFormat = (position) => formattedMoney(getSalary(position));

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
  maxWidth: '1200px',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
};

const CustomFooter = ({ positionBySalary, positions }) => {
  const { totalIncome, totalEmployees } = useMemo(() => {
    let sum = 0;
    let count = 0;
    positions.forEach(pos => {
      const employees = positionBySalary[pos] || [];
      count += employees.length;
      employees.forEach(emp => {
        const income = parseFloat(emp.income);
        if (!isNaN(income)) {
          sum += income;
        }
      })
    })
    return { totalIncome: sum, totalEmployees: count };
  }, [positionBySalary, positions]);

  return (
    <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 4, borderTop: '1px solid #e0e0e0' }}>
      <Typography variant="h6">
        Total Empleados: {totalEmployees}
      </Typography>
      <Typography variant="h6">
        Total General: {formattedMoney(totalIncome)}
      </Typography>
    </Box>
  );
};

export const ListGroup = ({ title, currentDate, setCurrentDate, url }) => {
  const [search, setSearch] = useState("");
  const [employee, setEmployee] = useState({});
  const [positions, setPositions] = useState([]);
  const [open, setOpen] = useState(false);
  const [allowedMonths, setAllowedMonths] = useState(new Set());
  const [expandedPositions, setExpandedPositions] = useState({});

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
      const [year, month] = data.at(-1).split("-")
      handleDate(new Date(year, month, 0));
    })
  }, []);

  const onChangeSearch = (e) => {
    const text = e.target.value;
    setSearch(text);
    if (!text) return setPositions(Object.keys(positionBySalary));
    setPositions(prev =>
      prev.filter(value =>
        value.toLowerCase().includes(text.toLowerCase()) ||
        positionBySalary[value].find(v => v.name.toLowerCase().includes(text.toLowerCase()) || v.income.toString().includes(text.toLowerCase())) ||
        getSalaryFormat(value).toString().toLowerCase().includes(text.toLowerCase())
      )
    );
  };

  const showImageModal = (employee) => {
    setEmployee(employee);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const shouldDisableMonth = (month) => { 
    const key = month.format("YYYY-MM");
    return !allowedMonths.has(key);
  };

  const toggleExpand = (positionName) => {
    setExpandedPositions(prev => ({
      ...prev,
      [positionName]: !prev[positionName]
    }));
  };

  const columns = [
    {
      field: 'expand',
      headerName: '',
      width: 70,
      sortable: false,
      renderCell: (params) => {
        if (!params.row.isParent) return null;
        return (
          <Button onClick={() => toggleExpand(params.row.positionName)}>
            {expandedPositions[params.row.positionName] ? '⬆️' : '⬇️'}
          </Button>
        );
      },
    },
    {
      field: 'name',
      headerName: 'Posición / Nombre',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'income',
      headerName: 'Salario / Ingreso',
      width: 150,
    },
    {
      field: 'actions',
      headerName: 'Cantidad / Acciones',
      width: 150,
      renderCell: (params) => {
        if (params.row.isParent) {
          return params.value; // Display count for parent
        }
        return (
          <Button variant="text" onClick={() => showImageModal(params.row.originalData)} sx={{ fontSize: '10px' }}>
            Ver fuente
          </Button>
        );
      },
    },
  ];

  const rows = useMemo(() => {
    let result = [];
    const sortedPositions = positions.sort((a, b) => getSalary(b) - getSalary(a));

    sortedPositions.forEach((position, index) => {
      // Add Parent Row
      result.push({
        id: `parent-${index}`,
        isParent: true,
        positionName: position,
        name: position,
        income: getSalaryFormat(position),
        actions: positionBySalary[position]?.length || 0,
      });

      // Add Child Rows if expanded
      if (expandedPositions[position]) {
        const employees = positionBySalary[position] || [];
        employees.forEach((emp, empIndex) => {
          // Apply filtering logic to children as well if search is active
          const text = search.toLowerCase();
          if (
            !text ||
            position.toLowerCase().includes(text) || // If parent matches, show all children? Or adhere to specific child match?
            // The original logic showed children if ANY match happened in the group. 
            // Let's stick to showing the children if the group is showing, but we might want to filter children too.
            // Re-reading original logic:
            // It filters the *positions* list.
            // Then inside the map, it filters *Rendered ListItemButtons*.
            // So if I search "Juan", the position "Gerente" appears.
            // But only "Juan" should appear under "Gerente".

            emp.name.toLowerCase().includes(text) ||
            emp.income.toString().includes(text) ||
            getSalaryFormat(position).toString().toLowerCase().includes(text)
          ) {
            result.push({
              id: `child-${index}-${empIndex}`,
              isParent: false,
              name: emp.name,
              income: formattedMoney(emp.income),
              actions: '',
              originalData: emp,
            });
          }
        });
      }
    });
    return result;
  }, [positions, expandedPositions, search]);


  return (
    <>
      <div id="list">
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
                currentDate={currentDate}
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Button variant="text" sx={{ fontSize: '10px', m: 0, p: 0 }}>
            <a href={Object.values(positionBySalary)?.[0]?.[0]?.link ?? ''} target="_blank" rel="noopener noreferrer">
              Ir al documento original
            </a>
          </Button>

          <Button variant="text" sx={{ fontSize: '10px', m: 0, p: 0 }}>
            <a href={`Eventos?allData=${JSON.stringify({ traceId: Object.values(positionBySalary)?.[0]?.[0]?.traceId ?? '' })}`} target="_blank" rel="noopener noreferrer">
              DEBBUG
            </a>
          </Button>
        </Box>

        <Box sx={{ height: 600, width: '100%', bgcolor: 'white' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={100}
            rowsPerPageOptions={[10, 50, 100]}
            disableRowSelectionOnClick
            getRowClassName={(params) => `super-app-theme--${params.row.isParent ? 'Parent' : 'Child'}`}
            sx={{
              '& .super-app-theme--Parent': {
                fontWeight: 'bold',
                bgcolor: '#f5f5f5',
                '&:hover': {
                  bgcolor: '#e0e0e0',
                }
              },
              '& .super-app-theme--Child': {
                pl: 4
              }
            }}
            slots={{
              footer: CustomFooter,
            }}
            slotProps={{
              footer: { positionBySalary, positions }
            }}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          />
        </Box>
      </div>
    </>
  );
};
