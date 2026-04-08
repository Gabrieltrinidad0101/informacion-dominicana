import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react'
import { lightTheme } from '../../themes/light';

export function SimpleSelect({ name, datas, onChange, value }) {
    return (
        <FormControl variant="filled" sx={lightTheme}>
            <InputLabel id="demo-simple-select-filled-label">
                {name}
            </InputLabel>
            <Select
                sx={
                    {minWidth: 200}
                }
                value={value}
                onChange={onChange}
                labelId="demo-simple-select-filled-label"
                id="demo-simple-select-filled"
            >
                {datas.map((data, index) => {
                    return (
                        <MenuItem key={index} value={data}>
                            {data}
                        </MenuItem>
                    );
                })}
            </Select>
        </FormControl>
    )
}
