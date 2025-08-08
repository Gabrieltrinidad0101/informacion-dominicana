import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Collapse from '@mui/material/Collapse';
import { useEffect, useState } from 'react';
import { Box, Button, createTheme, Fade, Modal, TextField, ThemeProvider, Typography } from '@mui/material';
import { formatToLastDayOfMonth, payroll, requestJson } from '../../utils/request';
import ListCss from './List.module.css';
import { formatted } from '../../utils/format';
import Backdrop from '@mui/material/Backdrop';
import { ShowImage } from '../showImage/ShowImage';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

let positionBySalary = {}

const getSalary = (position) =>
    positionBySalary[position]?.reduce((acc, row) => acc + parseInt(row.income), 0) / (positionBySalary[position]?.length ?? 1)

const getSalaryFormat = (position) => {
    return formatted(getSalary(position))
}

const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

export const getMonth = (text) => {
    const textloweCase = text.toLowerCase()
    if (textloweCase.includes("enero")) return "january"
    if (textloweCase.includes("febrero") || textloweCase.includes("feb")) return "february"
    if (textloweCase.includes("marzo")) return "march"
    if (textloweCase.includes("abril")) return "april"
    if (textloweCase.includes("mayo")) return "may"
    if (textloweCase.includes("junio")) return "june"
    if (textloweCase.includes("julio")) return "july"
    if (textloweCase.includes("agosto")) return "august"
    if (textloweCase.includes("septiembre")) return "september"
    if (textloweCase.includes("octubre")) return "october"
    if (textloweCase.includes("noviembre") || textloweCase === "11.pdf") return "november"
    if (textloweCase.includes("diciembre")) return "december"
}

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
                <Box ml={3}>
                    {open ? <i>⬆️</i> : <i>⬇️</i>}
                </Box>
            </ListItemButton>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {employees.map(({ name, income }, index) => (
                        <ListItemButton key={index}>
                            <Box display="flex" justifyContent="space-between" width="100%">
                                <Typography variant="body1" sx={{ fontSize: '10px', m: 0, p: 0 }}>{name}</Typography>
                                <Typography variant="body1" sx={{ fontSize: '10px', m: 0, p: 0 }}>{formatted(income)}</Typography>
                                <Button variant="text" onClick={() => showImage(employees[index])} sx={{ fontSize: '10px', m: 0, p: 0 }}>Ver fuente</Button>
                            </Box>
                        </ListItemButton>
                    ))}
                </List>
            </Collapse>
        </>
    )
}

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

export const ListGroup = ({ title, topic }) => {
    const [dates, setDates] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date())
    const [search, setSearch] = useState("")
    const [employee, setEmployee] = useState({})
    const [positions, setPositions] = useState([])
    const handleDate = async (date) => {
        setCurrentDate(new Date(date));
        const data = await requestJson(`datas/townHalls/${topic}/positionBySalary - ${formatToLastDayOfMonth(date)}`)
        positionBySalary = data;
        setPositions(Object.keys(positionBySalary))
    };

    useEffect(() => {
        payroll(topic).then((res) => {
            setDates(res);
            handleDate(res[0].time)
        });
    }, [])

    const darkTheme = createTheme({
        palette: {
            mode: 'dark',
        },
    });

    const onChangeSearch = (e) => {
        const text = e.target.value;
        setSearch(text);
        if (text === "") return setPositions(Object.keys(positionBySalary));
        setPositions((prevValue) =>
            prevValue.filter((value) =>
                value.toString().toLowerCase().includes(text.toString().toLowerCase())
            ));
    }

    const [open, setOpen] = useState(false);
    const handleClose = () => setOpen(false);

    const showImage = (employee) => {
        setEmployee(employee)
        setOpen(true)
    }

    const shouldDisableMonth = (month) => {
        return month.month() === 0 || month.month() === 11;
    };

    const monthName = monthNames[currentDate.getMonth?.()];
    return (
        <>
            <Modal
                aria-labelledby="transition-modal-title"
                aria-describedby="transition-modal-description"
                open={open}
                onClose={handleClose}
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
                        <ShowImage
                            url={`http://localhost:5500/dataPreprocessing/townHalls/${topic}/images/${currentDate.getFullYear?.()}/${getMonth(monthName)}/_${employee.page}.jpg`}
                            employee={employee}
                        />
                    </Box>
                </Fade>
            </Modal>
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
                            <DatePicker shouldDisableMonth={shouldDisableMonth} views={['month', 'year']} />
                        </LocalizationProvider>
                    </ThemeProvider>

                </div>
            </div>
            <List
                className={ListCss.list}
                sx={{
                    bgcolor: '#fff',
                    color: '#000',
                    borderRadius: 2,
                    p: 1,
                }}
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
                    {positions.sort((a, b) => getSalary(b) - getSalary(a)).map((position, index) => {
                        return <PositionAndSalary
                            key={index}
                            position={position}
                            getSalary={getSalaryFormat}
                            employees={positionBySalary[position]}
                            showImage={showImage}
                        />
                    })}
                </div>
            </List>
        </>
    );
}