import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Collapse from '@mui/material/Collapse';
import { useEffect, useState } from 'react';
import { Box, Button, Fade, Modal, TextField, Typography } from '@mui/material';
import { formatToLastDayOfMonth, payroll, requestJson } from '../../utils/request';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ListCss from './List.module.css';
import { formatted } from '../../utils/format';
import Backdrop from '@mui/material/Backdrop';
import { ShowImage } from '../showImage/ShowImage';
import es from 'date-fns/locale/es';

registerLocale('es', es);

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

export const PositionAndSalary = ({ position, employees, showImage }) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <ListItemButton onClick={() => setOpen(prev => !prev)}>
                <Box display="flex" justifyContent="space-between" width="100%">
                    <Typography>{position}</Typography>
                    <Typography>{getSalaryFormat(position)}</Typography>
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
    width: '50%',
    height: '80%',
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
                            url={`http://localhost:5500/dataPreprocessing/townHalls/${topic}/images/${currentDate.getFullYear?.()}/${monthName}/jarabacoaTownHall.${employee.page}.jpg`}
                            employee={employee}
                        />
                    </Box>
                </Fade>
            </Modal>
            <h1>{title} - {currentDate.getFullYear?.()}/{currentDate.getMonth?.() + 1}</h1>
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
                    <div>
                        🗓️
                    </div>
                    <div>
                        <DatePicker
                            selected={currentDate}
                            onChange={handleDate}
                            dateFormat="yyyy-MM"
                            showMonthYearPicker
                            className={ListCss.datePicker}
                            includeDates={dates.map(date => new Date(date.time))} // Enable only specific dates
                            locale="es" // Set locale to Spanish
                        />
                    </div>
                </div>
            </div>
            <List
                className={ListCss.list}
                sx={{
                    bgcolor: '#fff',       // black background
                    color: '#000',         // white text
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