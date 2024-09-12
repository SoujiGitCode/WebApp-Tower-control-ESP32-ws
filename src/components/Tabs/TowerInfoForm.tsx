import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';
import { useAppContext } from '@context/AppContext'; // Importar el contexto global para obtener la IP y otros datos
import { toast } from 'react-toastify';
import PasswordTextField from '@components/PasswordTextField';

const TowerInfoForm = () => {
    const { esp32IP } = useAppContext(); // Usar la IP desde el context
    const [loading, setLoading] = useState(true); // Para mostrar el spinner
    const [formData, setFormData] = useState({
        admin_password: '',
        id: '',
        name: '',
        slang: '',
        location: '',
        priority: '',
        type: '',
        loadcells_amount: ''
    });
    const [feedbackMessage, setFeedbackMessage] = useState({ message: '', type: '' });

    // Cargar la información inicial desde el endpoint GET
    useEffect(() => {
        const fetchTowerInfo = async () => {
            try {
                const response = await axios.get(`http://${esp32IP}/api/get/tower-info`);
                setFormData({
                    admin_password: '',
                    id: response.data.data.id,
                    name: response.data.data.name,
                    slang: response.data.data.slang,
                    location: response.data.data.location,
                    priority: response.data.data.priority,
                    type: response.data.data.type,
                    loadcells_amount: response.data.data.loadcells_amount,
                });
                setLoading(false);
            } catch (error) {
                toast.error('Error al cargar la información de la torre.');
                setFeedbackMessage({ message: 'Error al cargar la información de la torre.', type: 'error' });
                setLoading(false);
            }
        };

        fetchTowerInfo();
    }, [esp32IP]);

    // Manejar el cambio de valores en el formulario
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Manejar el submit del formulario
    const handleSubmit = async () => {
        // Crear un form-data para enviar los datos
        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            formDataToSend.append(key, value);
        });

        try {
            const response = await axios.post(`http://${esp32IP}/api/set/tower-info`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.status === 'success') {
                setFeedbackMessage({ message: 'Información de la torre actualizada exitosamente.', type: 'success' });
                toast.success('Información de la torre actualizada exitosamente.');
            } else {
                throw new Error('Error en la actualización.');
            }
        } catch (error) {
            setFeedbackMessage({ message: 'Error al actualizar la información de la torre.', type: 'error' });
            toast.error('Error al actualizar la información de la torre.');
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
                Información de la Torre
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
                label="ID"
                variant="outlined"
                fullWidth
                name="id"
                value={formData.id}
                onChange={handleChange}
                required
            />
            <TextField
                label="Name"
                variant="outlined"
                fullWidth
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
            />
            <TextField
                label="Slang"
                variant="outlined"
                fullWidth
                name="slang"
                value={formData.slang}
                onChange={handleChange}
                required
            />
            <TextField
                label="Location"
                variant="outlined"
                fullWidth
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
            />
            <TextField
                label="Priority"
                variant="outlined"
                fullWidth
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                type="number"
            />
            <TextField
                label="Type"
                variant="outlined"
                fullWidth
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
            />
            <TextField
                label="Load Cells Amount"
                variant="outlined"
                fullWidth
                name="loadcells_amount"
                value={formData.loadcells_amount}
                onChange={handleChange}
                required
                type="number"
            />
            <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ marginTop: 2 }}>
                Guardar
            </Button>

            {/* Mensajes de error o éxito */}
            {feedbackMessage.message && (
                <Typography color={feedbackMessage.type === 'success' ? 'primary' : 'error'} variant="body2" align="center">
                    {feedbackMessage.message}
                </Typography>
            )}
        </Box>
    );
};

export default TowerInfoForm;
