import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import axios from 'axios';
import { useAppContext } from '@context/AppContext'; // Usar la IP desde el contexto
import { toast } from 'react-toastify';
import PasswordTextField from '@components/PasswordTextField';

const WiFiForm = () => {
    const { setLoggedIn } = useAppContext();

    const { esp32IP } = useAppContext(); // Obtener la IP desde el contexto
    const [wifiData, setWifiData] = useState({
        ssid: '',
        password: ''
    });
    const [resetData, setResetData] = useState({
        admin_password: ''
    });

    const [wifiSuccessMessage, setWifiSuccessMessage] = useState('');
    const [wifiErrorMessage, setWifiErrorMessage] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState({ message: '', type: '' });

    // Manejar el cambio de valores en el formulario de WiFi
    const handleWifiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWifiData({ ...wifiData, [e.target.name]: e.target.value });
    };

    // Manejar el cambio de valores en el formulario de Factory Reset
    const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setResetData({ ...resetData, [e.target.name]: e.target.value });
    };

    // Enviar el formulario de WiFi
    const handleWifiSubmit = async () => {
        setWifiSuccessMessage('');
        setWifiErrorMessage('');
        const formDataToSend = new FormData();
        formDataToSend.append('ssid', wifiData.ssid);
        formDataToSend.append('password', wifiData.password);

        try {
            const response = await axios.post(`http://${esp32IP}/api/set/wifi`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.status === 'success') {
                setFeedbackMessage({ message: 'Configuración WiFi guardada exitosamente.', type: 'success' });
                toast.success('Configuración WiFi guardada exitosamente.');
                // Forzar logout y recargar la página
                setLoggedIn(false); // Cambia el estado de loggedIn a false
                toast.info('Has sido desconectado, redirigiendo al inicio...');

                setTimeout(() => {
                    window.location.reload(); // Recargar la página para llevar al inicio
                }, 2000); // Espera 2 segundos antes de recargar para mostrar el mensaje
            } else {
                setFeedbackMessage({ message: response?.data.message, type: 'error' });
                throw new Error('Error al guardar la configuración WiFi.');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al guardar la configuración WiFi.';
            setFeedbackMessage({ message: errorMessage, type: 'error' });
            toast.error('Error al guardar la configuración WiFi.');
        }
    };

    // Enviar el formulario de Factory Reset
    const handleResetSubmit = async () => {
        const formDataToSend = new FormData();
        formDataToSend.append('admin_password', resetData.admin_password);

        try {
            const response = await axios.post(`http://${esp32IP}/api/factory-reset`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.status === 'success') {
                setFeedbackMessage({ message: 'Reseteo a valores de fábrica exitoso.', type: 'success' });
                toast.success('Reseteo a valores de fábrica exitoso.');
                // Forzar logout y recargar la página
                setLoggedIn(false); // Cambia el estado de loggedIn a false
                toast.info('Has sido desconectado, redirigiendo al inicio...');

                setTimeout(() => {
                    window.location.reload(); // Recargar la página para llevar al inicio
                }, 2000); // Espera 2 segundos antes de recargar para mostrar el mensaje
            } else {
                throw new Error('Error al realizar el reseteo.');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al realizar el reseteo a valores de fábrica.';
            setFeedbackMessage({ message: errorMessage, type: 'error' });
            toast.error('Error al realizar el reseteo a valores de fábrica.');
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', justifyContent: 'center', gap: 3 }}>
            {/* Formulario para la configuración WiFi */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="h6" align="center" gutterBottom>
                    Configuración WiFi
                </Typography>
                <TextField
                    label="SSID - Nombre de la red WiFi"
                    variant="outlined"
                    fullWidth
                    name="ssid"
                    value={wifiData.ssid}
                    onChange={handleWifiChange}
                    required
                />
                {/* <TextField
                    label="Password"
                    variant="outlined"
                    fullWidth
                    name="password"
                    value={wifiData.password}
                    onChange={handleWifiChange}
                    type="password"
                    required
                /> */}
                <PasswordTextField
                    label="Contraseña de WIFI"
                    name="password"
                    fullWidth
                    value={wifiData.password}
                    onChange={handleWifiChange}
                />
                <Button variant="contained" color="primary" onClick={handleWifiSubmit} sx={{ marginTop: 2 }}>
                    Guardar
                </Button>
                {wifiErrorMessage && (
                    <Typography color="error" variant="body2" align="center">
                        {wifiErrorMessage}
                    </Typography>
                )}
                {wifiSuccessMessage && (
                    <Typography color="success" variant="body2" align="center">
                        {wifiSuccessMessage}
                    </Typography>
                )}
            </Box>

            {/* Formulario para el Factory Reset */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="h6" align="center" gutterBottom>
                    Reseteo a Valores de Fábrica
                </Typography>
                {/* <TextField
                    label="Contraseña de Administrador"
                    variant="outlined"
                    fullWidth
                    name="admin_password"
                    value={resetData.admin_password}
                    onChange={handleResetChange}
                    type="password"
                    required
                /> */}
                <PasswordTextField
                    label="Contraseña de Administrador"
                    name="admin_password"
                    fullWidth
                    value={resetData.admin_password}
                    onChange={handleResetChange}
                />

                <Button variant="contained" color="secondary" onClick={handleResetSubmit} sx={{ marginTop: 2 }}>
                    Reiniciar a valores de Fabrica
                </Button>
                {/* Mensajes de error o éxito */}
                {feedbackMessage.message && (
                    <Typography color={feedbackMessage.type === 'success' ? 'primary' : 'error'} variant="body2" align="center">
                        {feedbackMessage.message}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default WiFiForm;
