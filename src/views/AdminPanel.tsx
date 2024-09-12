import { useState } from 'react';
import { Tabs, Tab, Box, IconButton, Menu, MenuItem, AppBar, Toolbar, Typography } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TowerInfoForm from '@components/Tabs/TowerInfoForm';
import WiFiForm from '@components/Tabs/WiFiForm';
import CellsForm from '@components/Tabs/CellsForm';
import LoginForm from '@components/Auth/LoginForm'; // El componente de login
import { useAppContext } from '@context/AppContext'; // Importar el contexto

const AdminPanel = ({ setShowAdminPanel }: { setShowAdminPanel: (show: boolean) => void }) => {
    const { loggedIn, setLoggedIn } = useAppContext(); // Obtener el estado del login desde el contexto
    const [selectedTab, setSelectedTab] = useState(0);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        setLoggedIn(false); // Cambiar el estado global a "logged out"
        handleMenuClose();
    };

    // Si el usuario no está logueado, mostramos el LoginForm
    if (!loggedIn) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '70vh',
                }}
            >
                <LoginForm setShowAdminPanel={setShowAdminPanel} />
            </Box>
        );
    }

    // Si el usuario está logueado, mostramos las tabs y el menú de logout
    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'center !important' }}>
            {/* AppBar con el menú de logout */}
            <AppBar position="static" sx={{ backgroundColor: 'primary.secondary' }}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
                        Panel de Administrador
                    </Typography>
                    <IconButton edge="end" color="inherit" onClick={handleMenuOpen}>
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Contenido del panel */}
            <Box
                sx={{
                    maxWidth: 'md',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Tabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    centered
                    sx={{
                        width: '100%',
                        '& .MuiTabs-indicator': {
                            backgroundColor: 'primary.main',
                        },
                    }}
                >
                    <Tab label="Torre" sx={{ flex: 1, textAlign: 'center' }} />
                    <Tab label="WIFI" sx={{ flex: 1, textAlign: 'center' }} />
                    <Tab label="Celdas" sx={{ flex: 1, textAlign: 'center' }} />
                </Tabs>

                <Box
                    sx={{
                        width: '100%',
                        marginTop: 2,
                        padding: 4,
                        borderRadius: 2,
                        backgroundColor: 'background.paper',
                        boxShadow: 1,
                    }}
                >
                    {selectedTab === 0 && <TowerInfoForm />}
                    {selectedTab === 1 && <WiFiForm />}
                    {selectedTab === 2 && <CellsForm />}
                </Box>
            </Box>
        </Box>
    );
};

export default AdminPanel;
