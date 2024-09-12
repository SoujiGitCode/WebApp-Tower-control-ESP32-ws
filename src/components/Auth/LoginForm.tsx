import { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { useAppContext } from '@context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import AccessImage from '@assets/access.svg'; // Ruta hacia el SVG

const LoginForm = ({ setShowAdminPanel }: { setShowAdminPanel: (show: boolean) => void }) => {
    const { esp32IP, setLoggedIn } = useAppContext(); // Usar esp32IP desde el context
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);


            const response = await axios.post(`http://${esp32IP}/api/login`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.data.status === 'success') {
                setLoggedIn(true); // Cambiar el estado global a "logged in"
                // toast.success('Login successful, redirecting to admin panel...');
            } else {
                throw new Error('Unauthorized');
            }
        } catch (error) {
            // Mostrar error en Toast y en el formulario
            // toast.error('Datos incorrectos. Inténtelo de nuevo.');
            setErrorMessage('Usuario o contraseña incorrectos.');
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 350, gap: 3, pading: 2, justifyContent: 'center' }}>
            {/* Imagen SVG de acceso */}
            <img src={AccessImage} alt="Access" style={{ width: 150, height: 150 }} />

            {/* Inputs del formulario */}
            <TextField
                label="Username"
                variant="outlined"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
                label="Password"
                variant="outlined"
                fullWidth
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            {/* Botón de login */}
            <Button variant="contained" color="primary" onClick={handleLogin} sx={{ width: '100%' }}>
                Login
            </Button>

            <Button variant="outlined" color="secondary" onClick={() => setShowAdminPanel(false)} sx={{ width: '100%' }}>
                Volver
            </Button>

            {/* Mensaje de error */}
            {errorMessage && (
                <Typography color="error" variant="body2" align="center">
                    {errorMessage}
                </Typography>
            )}
        </Box>
    );
};

export default LoginForm;
