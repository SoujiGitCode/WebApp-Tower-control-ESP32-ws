import { useState } from 'react';
import { 
    Box, 
    TextField, 
    Button, 
    Typography, 
    Card, 
    CardContent, 
    Grid, 
    Divider,
    Paper,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { 
    Wifi as WifiIcon, 
    Save as SaveIcon, 
    RestartAlt as ResetIcon,
    Warning as WarningIcon,
    Router as RouterIcon,
    Lock as LockIcon,
    ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import { useAppContext } from '@context/AppContext';
import { toast } from 'react-toastify';
import PasswordTextField from '@components/PasswordTextField';

const WiFiForm = () => {
    const { setLoggedIn, currentApi, darkMode } = useAppContext();
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
    const [showResetModal, setShowResetModal] = useState(false);

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

        try {
            const response = await currentApi.setWiFiConfig({
                ssid: wifiData.ssid,
                password: wifiData.password
            });

            if (response.status === 'success') {
                setFeedbackMessage({ message: 'Configuración WiFi guardada exitosamente.', type: 'success' });
                toast.success('Configuración WiFi guardada exitosamente.');
                // Forzar logout y recargar la página
                setLoggedIn(false); // Cambia el estado de loggedIn a false
                toast.info('Has sido desconectado, redirigiendo al inicio...');

                setTimeout(() => {
                    window.location.reload(); // Recargar la página para llevar al inicio
                }, 2000); // Espera 2 segundos antes de recargar para mostrar el mensaje
            } else {
                setFeedbackMessage({ message: response.message || 'Error al guardar la configuración WiFi.', type: 'error' });
                toast.error('Error al guardar la configuración WiFi.');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Error al guardar la configuración WiFi.';
            setFeedbackMessage({ message: errorMessage, type: 'error' });
            toast.error('Error al guardar la configuración WiFi.');
        }
    };

    // Enviar el formulario de Factory Reset
    const handleResetSubmit = async () => {
        try {
            const response = await currentApi.factoryReset(resetData.admin_password);

            if (response.status === 'success') {
                setFeedbackMessage({ message: 'Reseteo a valores de fábrica exitoso.', type: 'success' });
                toast.success('Reseteo a valores de fábrica exitoso.');
                // Forzar logout y recargar la página
                setLoggedIn(false);
                toast.info('Has sido desconectado, redirigiendo al inicio...');

                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                setFeedbackMessage({ message: response.message || 'Error al realizar el reseteo.', type: 'error' });
                toast.error('Error al realizar el reseteo a valores de fábrica.');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Error al realizar el reseteo a valores de fábrica.';
            setFeedbackMessage({ message: errorMessage, type: 'error' });
            toast.error('Error al realizar el reseteo a valores de fábrica.');
        } finally {
            setShowResetModal(false);
        }
    };

    // Función para abrir el modal de confirmación
    const handleOpenResetModal = () => {
        setShowResetModal(true);
    };

    // Función para cerrar el modal
    const handleCloseResetModal = () => {
        setShowResetModal(false);
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            width: '100%', 
            maxWidth: { xs: '100%', sm: 600, md: 800 },
            margin: '0 auto',
            gap: { xs: 1.5, sm: 2 },
            p: { xs: 0.5, sm: 1 }
        }}>
            {/* Header */}
            <Paper 
                elevation={3} 
                sx={{ 
                    p: { xs: 1.5, sm: 2 }, 
                    background: darkMode 
                        ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' 
                        : 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
                    color: 'white',
                    borderRadius: 2
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: 1 }}>
                    <WifiIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                    <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }}>
                        Configuración de Red y Sistema
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ opacity: 0.9, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Gestiona la conectividad WiFi y configuración del dispositivo
                </Typography>
            </Paper>

            {/* Configuración WiFi */}
            <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                    <Typography variant="h6" gutterBottom sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        mb: { xs: 1.5, sm: 2 },
                        fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}>
                        📶 Configuración WiFi
                    </Typography>
                    
                    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                        <Grid item xs={12}>
                            <TextField
                                label="SSID - Nombre de la red WiFi"
                                variant="outlined"
                                fullWidth
                                name="ssid"
                                value={wifiData.ssid}
                                onChange={handleWifiChange}
                                required
                                size={window.innerWidth < 600 ? "medium" : "large"}
                                InputProps={{
                                    startAdornment: <RouterIcon sx={{ color: 'action.active', mr: 1 }} />
                                }}
                                helperText="Ingresa el nombre exacto de tu red WiFi"
                                sx={{
                                    '& .MuiInputBase-root': {
                                        fontSize: { xs: '0.9rem', sm: '1rem' },
                                        minHeight: { xs: 48, sm: 56 }
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <PasswordTextField
                                label="Contraseña de WiFi"
                                name="password"
                                fullWidth
                                size={window.innerWidth < 600 ? "medium" : "large"}
                                value={wifiData.password}
                                onChange={handleWifiChange}
                                helperText="Contraseña de seguridad de la red WiFi"
                                sx={{
                                    '& .MuiInputBase-root': {
                                        fontSize: { xs: '0.9rem', sm: '1rem' },
                                        minHeight: { xs: 48, sm: 56 }
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>

                    {/* Botón WiFi */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 2.5, sm: 3 } }}>
                        <Button 
                            variant="contained" 
                            size="large"
                            onClick={handleWifiSubmit}
                            startIcon={<SaveIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                            disabled={!wifiData.ssid || !wifiData.password}
                            sx={{ 
                                minWidth: { xs: '100%', sm: 200 },
                                maxWidth: { xs: '100%', sm: 280 },
                                py: { xs: 1.5, sm: 1.2 },
                                px: { xs: 2, sm: 3 },
                                fontSize: { xs: '1rem', sm: '1.1rem' },
                                fontWeight: 'bold',
                                background: darkMode 
                                    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
                                    : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                                '&:hover': {
                                    background: darkMode 
                                        ? 'linear-gradient(135deg, #047857 0%, #059669 100%)' 
                                        : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                    boxShadow: '0 5px 14px rgba(16, 185, 129, 0.4)',
                                    transform: 'translateY(-1px)',
                                },
                                '&:disabled': {
                                    background: 'rgba(0,0,0,0.12)',
                                    color: 'rgba(0,0,0,0.26)'
                                },
                                transition: 'all 0.2s ease-in-out'
                            }}
                        >
                            Guardar WiFi
                        </Button>
                    </Box>

                    {/* Mensajes de WiFi */}
                    {(wifiErrorMessage || wifiSuccessMessage) && (
                        <Box sx={{ mt: { xs: 2, sm: 2 } }}>
                            <Alert 
                                severity={wifiSuccessMessage ? 'success' : 'error'}
                                sx={{ 
                                    borderRadius: 2,
                                    fontSize: { xs: '0.85rem', sm: '0.9rem' }
                                }}
                            >
                                {wifiSuccessMessage || wifiErrorMessage}
                            </Alert>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Factory Reset */}
            <Card elevation={2} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'warning.main' }}>
                <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1.5, sm: 2 } }}>
                        <WarningIcon sx={{ color: 'warning.main', fontSize: { xs: 24, sm: 28 } }} />
                        <Typography variant="h6" color="warning.main" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                            Zona de Peligro
                        </Typography>
                    </Box>
                    
                    <Alert severity="warning" sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                            ⚠️ <strong>Advertencia:</strong> Esta acción eliminará permanentemente toda la configuración del dispositivo y lo restaurará a los valores de fábrica.
                        </Typography>
                    </Alert>

                    <Typography variant="h6" gutterBottom sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        mb: { xs: 2, sm: 3 },
                        fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}>
                        🔄 Reseteo a Valores de Fábrica
                    </Typography>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ 
                        mb: { xs: 2, sm: 3 },
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        lineHeight: 1.6
                    }}>
                        Esta acción restaurará el dispositivo a su configuración original de fábrica, 
                        eliminando todas las configuraciones personalizadas, credenciales WiFi, y datos almacenados.
                    </Typography>

                    {/* Botón Factory Reset */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Button 
                            variant="contained" 
                            size="large"
                            onClick={handleOpenResetModal}
                            startIcon={<ResetIcon sx={{ fontSize: 22 }} />}
                            sx={{ 
                                minWidth: { xs: '100%', sm: 280 },
                                py: { xs: 2, sm: 1.5 },
                                px: { xs: 3, sm: 4 },
                                fontSize: { xs: '1rem', sm: '1.1rem' },
                                fontWeight: 'bold',
                                color: '#ffffff',
                                background: darkMode 
                                    ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' 
                                    : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3), 0 2px 6px rgba(220, 38, 38, 0.2)',
                                border: '2px solid rgba(255, 255, 255, 0.2)',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                                '&:hover': {
                                    background: darkMode 
                                        ? 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)' 
                                        : 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                                    boxShadow: '0 6px 16px rgba(185, 28, 28, 0.4), 0 3px 8px rgba(185, 28, 28, 0.3)',
                                    transform: 'translateY(-2px)',
                                },
                                '&:active': {
                                    transform: 'translateY(0)',
                                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                                },
                                transition: 'all 0.2s ease-in-out'
                            }}
                        >
                            Resetear a Valores de Fábrica
                        </Button>
                    </Box>

                    {/* Mensajes de Factory Reset */}
                    {feedbackMessage.message && (
                        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
                            <Alert 
                                severity={feedbackMessage.type === 'success' ? 'success' : 'error'}
                                sx={{ 
                                    borderRadius: 2,
                                    fontSize: { xs: '0.85rem', sm: '0.9rem' }
                                }}
                            >
                                {feedbackMessage.message}
                            </Alert>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Modal de confirmación para Factory Reset */}
            <Dialog 
                open={showResetModal} 
                onClose={handleCloseResetModal}
                maxWidth="sm"
                fullWidth
                fullScreen={window.innerWidth < 600}
                PaperProps={{
                    sx: { 
                        borderRadius: { xs: 0, sm: 3 },
                        border: '2px solid',
                        borderColor: 'error.main',
                        m: { xs: 0, sm: 2 },
                        maxHeight: { xs: '100vh', sm: '90vh' }
                    }
                }}
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 1.5, sm: 2 }, 
                    backgroundColor: 'error.main',
                    color: 'white',
                    py: { xs: 2, sm: 2 },
                    px: { xs: 2, sm: 3 }
                }}>
                    <ErrorIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                            ⚠️ Confirmación de Reseteo
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                            Esta acción es irreversible
                        </Typography>
                    </Box>
                </DialogTitle>
                
                <DialogContent sx={{ 
                    py: { xs: 2, sm: 3 },
                    px: { xs: 2, sm: 3 },
                    overflowY: 'auto'
                }}>
                    <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                        <Typography variant="body1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                            🚨 ADVERTENCIA CRÍTICA
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                            Estás a punto de realizar un reseteo completo a valores de fábrica.
                        </Typography>
                    </Alert>

                    <Typography variant="h6" gutterBottom color="error" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        Los siguientes datos se perderán PERMANENTEMENTE:
                    </Typography>
                    
                    <Box component="ul" sx={{ pl: 2, color: 'text.secondary' }}>
                        <Typography component="li" variant="body2" sx={{ mb: 1, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                            📶 <strong>Configuración WiFi</strong> - Credenciales de red
                        </Typography>
                        <Typography component="li" variant="body2" sx={{ mb: 1, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                            🏗️ <strong>Información de la Torre</strong> - ID, nombre, ubicación, etc.
                        </Typography>
                        <Typography component="li" variant="body2" sx={{ mb: 1, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                            👥 <strong>Usuarios y Contraseñas</strong> - Todas las cuentas configuradas
                        </Typography>
                        <Typography component="li" variant="body2" sx={{ mb: 1, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                            ⚙️ <strong>Configuraciones Personalizadas</strong> - Thresholds, alarmas, etc.
                        </Typography>
                        <Typography component="li" variant="body2" sx={{ mb: 1, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                            📊 <strong>Datos Almacenados</strong> - Logs y registros del sistema
                        </Typography>
                    </Box>

                    <Alert severity="info" sx={{ mt: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                            💡 <strong>Después del reseteo:</strong> El dispositivo volverá a su estado inicial 
                            y deberás configurar todo desde cero, incluyendo la conexión WiFi.
                        </Typography>
                    </Alert>
                </DialogContent>

                <DialogActions sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    gap: 2, 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'stretch'
                }}>
                    <Button 
                        onClick={handleCloseResetModal} 
                        variant="outlined"
                        size="large"
                        sx={{ 
                            minWidth: { xs: '100%', sm: 120 },
                            py: { xs: 1.5, sm: 1 },
                            order: { xs: 2, sm: 1 }
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleResetSubmit} 
                        variant="contained" 
                        color="error"
                        size="large"
                        startIcon={<ResetIcon sx={{ fontSize: 20 }} />}
                        sx={{ 
                            minWidth: { xs: '100%', sm: 180 },
                            py: { xs: 2, sm: 1.2 },
                            fontSize: { xs: '1rem', sm: '0.9rem' },
                            fontWeight: 'bold',
                            color: '#ffffff',
                            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3), 0 2px 6px rgba(220, 38, 38, 0.2)',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                            order: { xs: 1, sm: 2 },
                            '&:hover': {
                                background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                                boxShadow: '0 6px 16px rgba(185, 28, 28, 0.4), 0 3px 8px rgba(185, 28, 28, 0.3)',
                                transform: 'translateY(-1px)',
                            },
                            '&:active': {
                                transform: 'translateY(0)',
                                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                            },
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        SÍ, Resetear Todo
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WiFiForm;
