import { TextField } from '@mui/material';
import React from 'react'
import { lightTheme } from '../../themes/light';

export const InputText = ({ label, value, onChangeSearch }) => {
    return (
        <TextField
            fullWidth
            label={label}
            variant="filled"
            value={value}
            onChange={onChangeSearch}
            sx={lightTheme}
        />
    )
}
