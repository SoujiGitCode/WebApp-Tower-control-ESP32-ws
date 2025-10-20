import React, { useEffect, useState } from 'react';
import { 
    Box, 
    TextField, 
    Button, 
    CircularProgress, 
    Typography, 
    Card, 
    CardContent, 
    Grid, 
    Divider,
    Paper,
    Alert
} from '@mui/material';
import { 
    CellTower as TowerIcon, 
    Save as SaveIcon, 
    LocationOn as LocationIcon,
    Numbers as NumbersIcon,
    Category as CategoryIcon 
} from '@mui/icons-material';
import axios from 'axios';
import { useAppContext } from '@context/AppContext';
import { toast } from 'react-toastify';

const TowerInfoForm = () => {
    const { esp32IP, darkMode, currentUser } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        location: '',
        priority: '',
        type: '',
        levels_count: ''
    });
    const [feedbackMessage, setFeedbackMessage] = useState({ message: '', type: '' });

    // Cargar la información inicial desde el endpoint GET
    useEffect(() => {
        const fetchTowerInfo = async () => {
            try {
                // Obtener el token del usuario actual
                const token = currentUser?.sessionId;
                if (!token) {
                    throw new Error('No se encontró token de autenticación');
                }

                const response = await axios.get(`http://${esp32IP}/api/get/tower-info`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const towerData = response.data.data;
                
                setFormData({
                    id: towerData.id || '',
                    name: towerData.name || '',
                    location: towerData.location || '',
                    priority: towerData.priority?.toString() || '1',
                    type: towerData.type || '',
                    levels_count: towerData.levels_count?.toString() || '4',
                });
                
                // Guardar levels_count en localStorage para usar en el Dashboard
                if (towerData.levels_count) {
                    localStorage.setItem('tower_levels_count', towerData.levels_count.toString());
                    console.log('✅ Levels count guardado en localStorage:', towerData.levels_count);
                }
                
                setLoading(false);
                toast.success('Información de la torre cargada correctamente');
            } catch (error) {
                console.error('❌ Error al cargar tower info:', error);
                toast.error('Error al obtener información de la torre');
                setFeedbackMessage({ message: 'Error al cargar la información de la torre.', type: 'error' });
                setLoading(false);
            }
        };

        fetchTowerInfo();
    }, [esp32IP, currentUser]);

    // Manejar el cambio de valores en el formulario
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Manejar el submit del formulario
    const handleSubmit = async () => {
        try {
            // Obtener el token del usuario actual
            const token = currentUser?.sessionId;
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }

            // Crear un form-data para enviar los datos
            const formDataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value);
            });

            const response = await axios.post(`http://${esp32IP}/api/set/tower-info`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.status === 'success') {
                // Actualizar localStorage con el nuevo levels_count
                if (formData.levels_count) {
                    localStorage.setItem('tower_levels_count', formData.levels_count);
                    console.log('✅ Levels count actualizado en localStorage:', formData.levels_count);
                }
                
                setFeedbackMessage({ message: 'Información de la torre actualizada exitosamente.', type: 'success' });
                toast.success('Información de la torre actualizada exitosamente.');
            } else {
                throw new Error('Error en la actualización.');
            }
        } catch (error) {
            console.error('❌ Error al actualizar tower info:', error);
            setFeedbackMessage({ message: 'Error al actualizar la información de la torre.', type: 'error' });
            toast.error('Error al actualizar la información de la torre.');
        }
    };

    // Mostrar spinner mientras los datos se cargan
    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: 400,
                gap: 1
            }}>
                <CircularProgress size={60} sx={{ color: darkMode ? '#60a5fa' : '#3b82f6' }} />
                <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                    Cargando información de la torre...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            width: '100%', 
            maxWidth: 800,
            margin: '0 auto',
            gap: 2,
            p: 1
        }}>
            {/* Header */}
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 3, 
                    background: darkMode 
                        ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' 
                        : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                    color: 'white',
                    borderRadius: 2
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <TowerIcon sx={{ fontSize: 32 }} />
                    <Typography variant="h5" fontWeight="bold">
                        Sistema de Alarma de Tensión de Piolas
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Configuración de la información de la torre de transmisión
                </Typography>
            </Paper>

            {/* Formulario */}
            <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 4 }}>
                    {/* Información básica */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            🏗️ Información Básica
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="ID de la Torre"
                                    variant="outlined"
                                    fullWidth
                                    name="id"
                                    value={formData.id}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: <NumbersIcon sx={{ color: 'action.active', mr: 1 }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Nombre de la Torre"
                                    variant="outlined"
                                    fullWidth
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: <TowerIcon sx={{ color: 'action.active', mr: 1 }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Ubicación"
                                    variant="outlined"
                                    fullWidth
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: <LocationIcon sx={{ color: 'action.active', mr: 1 }} />
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Configuración técnica */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            ⚙️ Configuración Técnica
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Prioridad"
                                    variant="outlined"
                                    fullWidth
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    required
                                    type="number"
                                    helperText="Nivel de prioridad (1-10)"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Tipo de Torre"
                                    variant="outlined"
                                    fullWidth
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: <CategoryIcon sx={{ color: 'action.active', mr: 1 }} />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Cantidad de Niveles"
                                    variant="outlined"
                                    fullWidth
                                    name="levels_count"
                                    value={formData.levels_count}
                                    onChange={handleChange}
                                    required
                                    type="number"
                                    helperText="Número de niveles/dispositivos esperados"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Botón de guardar */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Button 
                            variant="contained" 
                            size="large"
                            onClick={handleSubmit}
                            startIcon={<SaveIcon />}
                            sx={{ 
                                minWidth: 200,
                                py: 1.5,
                                background: darkMode 
                                    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
                                    : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                '&:hover': {
                                    background: darkMode 
                                        ? 'linear-gradient(135deg, #047857 0%, #059669 100%)' 
                                        : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                }
                            }}
                        >
                            Guardar Configuración
                        </Button>
                    </Box>

                    {/* Mensajes de feedback */}
                    {feedbackMessage.message && (
                        <Box sx={{ mt: 3 }}>
                            <Alert 
                                severity={feedbackMessage.type === 'success' ? 'success' : 'error'}
                                sx={{ borderRadius: 2 }}
                            >
                                {feedbackMessage.message}
                            </Alert>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default TowerInfoForm;
