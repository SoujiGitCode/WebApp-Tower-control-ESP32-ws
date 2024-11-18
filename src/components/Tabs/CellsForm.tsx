import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';
import { useAppContext } from '@context/AppContext'; // Importar el contexto global para obtener la IP y otros datos
import { toast } from 'react-toastify';
import PasswordTextField from '@components/PasswordTextField';

const CellsForm = () => {
    const { esp32IP } = useAppContext(); // Usar la IP desde el context
    const [loading, setLoading] = useState(true); // Para mostrar el spinner mientras carga
    const [formData, setFormData] = useState({
        admin_password: '',
        first_cell: '',
        second_cell: '',
        third_cell: '',
        fourth_cell: '',
        first_read_1: '',
        first_read_2: '',
        first_read_3: '',
        first_read_4: ''
    });
    const [feedbackMessage, setFeedbackMessage] = useState({ message: '', type: '' });

    // Cargar la información inicial desde el endpoint GET
    useEffect(() => {
        const fetchCellsInfo = async () => {
            try {
                const response = await axios.get(`http://${esp32IP}/api/get/cells`);
                setFormData({
                    admin_password: '',
                    first_cell: response.data.data.first_cell,
                    second_cell: response.data.data.second_cell,
                    third_cell: response.data.data.third_cell,
                    fourth_cell: response.data.data.fourth_cell,
                    first_read_1: response.data.data.first_read_1,
                    first_read_2: response.data.data.first_read_2,
                    first_read_3: response.data.data.first_read_3,
                    first_read_4: response.data.data.first_read_4,
                });
                setLoading(false);
            } catch (error) {
                setFeedbackMessage({ message: 'Error al cargar la información de las celdas.', type: 'error' });
                toast.error('Error al cargar la información de las celdas.');
                setLoading(false);
            }
        };

        fetchCellsInfo();
    }, [esp32IP]);

    // Manejar el cambio de valores en el formulario
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Manejar el submit del formulario
    const handleSubmit = async () => {
        try {
            const formDataObj = new FormData();
            formDataObj.append('admin_password', formData.admin_password);
            formDataObj.append('first_cell', formData.first_cell);
            formDataObj.append('second_cell', formData.second_cell);
            formDataObj.append('third_cell', formData.third_cell);
            formDataObj.append('fourth_cell', formData.fourth_cell);
            formDataObj.append('first_read_1', formData.first_read_1);
            formDataObj.append('first_read_2', formData.first_read_2);
            formDataObj.append('first_read_3', formData.first_read_3);
            formDataObj.append('first_read_4', formData.first_read_4);

            const response = await axios.post(`http://${esp32IP}/api/set/cells`, formDataObj, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.status === 'success') {
                setFeedbackMessage({ message: 'Configuración de celdas guardada exitosamente.', type: 'success' });
                toast.success('Configuración de celdas guardada exitosamente.');
            } else {
                setFeedbackMessage({ message: response.data.message || 'Error al guardar la configuración de celdas.', type: 'error' });
                toast.error(response.data.message || 'Error al guardar la configuración de celdas.');
            }
        } catch (error) {
            setFeedbackMessage({ message: error.response?.data?.message || 'Error al guardar la configuración de celdas.', type: 'error' });
            toast.error('Error al guardar la configuración de celdas.');
        }
    };

    // Mostrar spinner mientras los datos se cargan
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', justifyContent: 'center', gap: 3 }}>
            <Typography variant="h6" align="center" gutterBottom>
                Configuración de Celdas
            </Typography>
            {/* <TextField
                label="Contraseña de Administrador"
                variant="outlined"
                fullWidth
                name="admin_password"
                value={formData.admin_password}
                onChange={handleChange}
                type="password"
                required
            /> */}

            <PasswordTextField
                label="Contraseña de Administrador"
                name="admin_password"
                fullWidth
                value={formData.admin_password}
                onChange={handleChange}
            />
            <TextField
                label="First Cell"
                variant="outlined"
                fullWidth
                name="first_cell"
                value={formData.first_cell}
                onChange={handleChange}
                required
                type="number"
            />
            <TextField
                label="Second Cell"
                variant="outlined"
                fullWidth
                name="second_cell"
                value={formData.second_cell}
                onChange={handleChange}
                required
                type="number"
            />
            <TextField
                label="Third Cell"
                variant="outlined"
                fullWidth
                name="third_cell"
                value={formData.third_cell}
                onChange={handleChange}
                required
                type="number"
            />
            <TextField
                label="Fourth Cell"
                variant="outlined"
                fullWidth
                name="fourth_cell"
                value={formData.fourth_cell}
                onChange={handleChange}
                required
                type="number"
            />
            <TextField
                label="First Read 1"
                variant="outlined"
                fullWidth
                name="first_read_1"
                value={formData.first_read_1}
                onChange={handleChange}
                required
                type="number"
            />
            <TextField
                label="First Read 2"
                variant="outlined"
                fullWidth
                name="first_read_2"
                value={formData.first_read_2}
                onChange={handleChange}
                required
                type="number"
            />
            <TextField
                label="First Read 3"
                variant="outlined"
                fullWidth
                name="first_read_3"
                value={formData.first_read_3}
                onChange={handleChange}
                required
                type="number"
            />
            <TextField
                label="First Read 4"
                variant="outlined"
                fullWidth
                name="first_read_4"
                value={formData.first_read_4}
                onChange={handleChange}
                required
                type="number"
            />
            <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ marginTop: 2 }}>
                Guardar
            </Button>

            {feedbackMessage.message && (
                <Typography color={feedbackMessage.type === 'success' ? 'primary' : 'error'} variant="body2" align="center">
                    {feedbackMessage.message}
                </Typography>
            )}
        </Box>
    );
};

export default CellsForm;
