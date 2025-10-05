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
import UsersForm from "../components/Tabs/UsersForm";
// import CellsForm from "../components/Tabs/CellsForm";
import LoginForm from "../components/Auth/LoginForm";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { loggedIn, logout, currentUser, isAdmin, darkMode } = useAppContext();
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
        minHeight: "100vh",
        background: darkMode
          ? "linear-gradient(135deg, #1e293b 0%, #334155 30%, #475569 70%, #64748b 100%)"
          : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "start",
        alignItems: "center !important",
      }}
    >
      {/* AppBar con información del usuario y menú */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: darkMode
            ? "linear-gradient(90deg, #334155 0%, #475569 50%, #64748b 100%)"
            : "linear-gradient(90deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)",
          borderBottom: darkMode
            ? "1px solid #6b7280"
            : "1px solid rgba(255,255,255,0.2)",
        }}
      >
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
          p: { xs: 2, sm: 3 },
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          centered
          sx={{
            width: "100%",
            backgroundColor: darkMode
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.9)",
            borderRadius: 2,
            border: darkMode
              ? "1px solid rgba(255,255,255,0.2)"
              : "1px solid rgba(0,0,0,0.1)",
            "& .MuiTabs-indicator": {
              backgroundColor: darkMode ? "#60a5fa" : "primary.main",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
            "& .MuiTab-root": {
              color: darkMode ? "#e5e7eb" : "text.primary",
              fontWeight: 500,
              "&.Mui-selected": {
                color: darkMode ? "#60a5fa" : "primary.main",
                fontWeight: 600,
              },
            },
          }}
        >
          <Tab label="Torre" sx={{ flex: 1, textAlign: "center" }} />
          <Tab
            label="WIFI"
            sx={{ flex: 1, textAlign: "center" }}
            disabled={!isAdmin} // Solo admin puede acceder
          />
          <Tab
            label="Usuarios"
            sx={{ flex: 1, textAlign: "center" }}
            disabled={!isAdmin} // Solo admin puede acceder
          />
          {/* <Tab label="Celdas" sx={{ flex: 1, textAlign: "center" }} /> */}
        </Tabs>

        <Box
          sx={{
            width: "100%",
            marginTop: 3,
            padding: { xs: 3, sm: 4 },
            borderRadius: 2,
            background: darkMode
              ? "linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%)"
              : "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
            border: darkMode ? "1px solid #6b7280" : "1px solid #E2E8F0",
            boxShadow: darkMode
              ? "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
              : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          }}
        >
          {selectedTab === 0 && <TowerInfoForm />}
          {selectedTab === 1 && <WiFiForm />}
          {selectedTab === 2 && <UsersForm />}
          {/* {selectedTab === 3 && <CellsForm />} */}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminPanel;
