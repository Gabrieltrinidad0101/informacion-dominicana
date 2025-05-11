import { TextField } from '@mui/material';
import React from 'react'
import { lightTheme } from '../../themes/light';

export const InputText = ({ label, search, onChangeSearch }) => {
    return (
        <TextField
            fullWidth
            label={label}
            variant="filled"
            value={search}
            onChange={onChangeSearch}
            sx={lightTheme}
        />
    )
}
