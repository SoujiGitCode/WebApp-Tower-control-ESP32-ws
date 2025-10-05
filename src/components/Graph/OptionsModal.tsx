import React from 'react';
import { Box, Modal, TextField, MenuItem, Button } from '@mui/material';

const OptionsModal = ({
    open,
    onClose,
    interval,
    setInterval,
    valueCount,
    setValueCount,
    min,
    setMin,
    max,
    setMax,
    chartMax,
    setChartMax,
    dataFormat,
    setDataFormat,
}) => (
    <Modal open={open} onClose={onClose}>
        <Box sx={{ padding: 3, borderRadius: 2, backgroundColor: 'background.paper' }}>
            <TextField
                fullWidth
                label="Intervalo (segundos)"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label="Cantidad de valores"
                value={valueCount}
                onChange={(e) => setValueCount(Number(e.target.value))}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label="Mínimo permitido"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label="Máximo permitido"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                select
                label="Formato de datos"
                value={dataFormat}
                onChange={(e) => setDataFormat(e.target.value)}
                sx={{ mb: 2 }}
            >
                <MenuItem value="Kilogramos">Kilogramos Fuerza</MenuItem>
                <MenuItem value="Gramos">Gramos</MenuItem>
                <MenuItem value="Newtons">Newtons</MenuItem>
            </TextField>
            <TextField
                fullWidth
                label="Máximo del gráfico"
                value={chartMax}
                onChange={(e) => setChartMax(Number(e.target.value))}
                sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button variant="outlined" color="error" onClick={onClose}>
                    Cancelar
                </Button>
                <Button variant="contained" color="primary" onClick={onClose}>
                    Guardar
                </Button>
            </Box>
        </Box>
    </Modal>
);

export default OptionsModal;
