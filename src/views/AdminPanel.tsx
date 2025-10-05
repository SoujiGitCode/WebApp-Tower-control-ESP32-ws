import { useState } from "react";
import {
  Tabs,
  Tab,
  Box,
  IconButton,
  Menu,
  MenuItem,
  AppBar,
  Toolbar,
  Typography,
  Chip,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useNavigate } from "react-router-dom";
import TowerInfoForm from "../components/Tabs/TowerInfoForm";
import WiFiForm from "../components/Tabs/WiFiForm";
// import CellsForm from "../components/Tabs/CellsForm";
import LoginForm from "../components/Auth/LoginForm";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { loggedIn, logout, currentUser, isAdmin } = useAppContext();
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
    logout();
    handleMenuClose();
    toast.info("Sesión cerrada correctamente", {
      position: "top-right",
      autoClose: 3000,
    });
  };

  // Si el usuario no está logueado, mostramos el LoginForm
  if (!loggedIn) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
        }}
      >
        <LoginForm />
      </Box>
    );
  }

  // Si el usuario está logueado, mostramos las tabs y el menú de logout
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "start",
        alignItems: "center !important",
      }}
    >
      {/* AppBar con información del usuario y menú */}
      <AppBar position="static" sx={{ backgroundColor: "primary.main" }}>
        <Toolbar>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1 }}
          >
            <Typography variant="h6">Panel de Administrador</Typography>

            {/* Información del usuario */}
            <Chip
              icon={isAdmin ? <AdminPanelSettingsIcon /> : <PersonIcon />}
              label={`${currentUser?.username} (${currentUser?.role})`}
              variant="outlined"
              size="small"
              sx={{
                color: "white",
                borderColor: "white",
                "& .MuiChip-icon": { color: "white" },
              }}
            />
          </Box>

          <IconButton edge="end" color="inherit" onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Contenido del panel */}
      <Box
        sx={{
          maxWidth: "md",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          centered
          sx={{
            width: "100%",
            "& .MuiTabs-indicator": {
              backgroundColor: "primary.main",
            },
          }}
        >
          <Tab label="Torre" sx={{ flex: 1, textAlign: "center" }} />
          <Tab
            label="WIFI"
            sx={{ flex: 1, textAlign: "center" }}
            disabled={!isAdmin} // Solo admin puede acceder
          />
          {/* <Tab label="Celdas" sx={{ flex: 1, textAlign: "center" }} /> */}
        </Tabs>

        <Box
          sx={{
            width: "100%",
            marginTop: 2,
            padding: 4,
            borderRadius: 2,
            backgroundColor: "background.paper",
            boxShadow: 1,
          }}
        >
          {selectedTab === 0 && <TowerInfoForm />}
          {selectedTab === 1 && <WiFiForm />}
          {/* {selectedTab === 2 && <CellsForm />} */}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminPanel;
