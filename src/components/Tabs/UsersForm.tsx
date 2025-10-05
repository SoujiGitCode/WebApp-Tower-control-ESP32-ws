import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-toastify";

interface User {
  id: number;
  username: string;
  role: "admin" | "user";
}

const UsersForm = () => {
  const { darkMode, isAdmin, logout } = useAppContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Simular datos de usuarios (en una app real vendría de la API)
  useEffect(() => {
    const mockUsers: User[] = [
      { id: 1, username: "admin", role: "admin" },
      { id: 2, username: "usuario1", role: "user" },
      { id: 3, username: "usuario2", role: "user" },
      { id: 4, username: "operador", role: "user" },
    ];

    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 500);
  }, []);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      confirmPassword: "",
    });
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      confirmPassword: "",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSaveUser = () => {
    if (!editingUser) return;

    // Validaciones
    if (!formData.username.trim()) {
      toast.error("El username no puede estar vacío");
      return;
    }

    if (formData.password && formData.password.length < 4) {
      toast.error("La contraseña debe tener al menos 4 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    // Verificar que el username no esté en uso por otro usuario
    const usernameExists = users.some(
      (user) =>
        user.username === formData.username && user.id !== editingUser.id
    );
    if (usernameExists) {
      toast.error("Este username ya está en uso");
      return;
    }

    // Actualizar usuario
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === editingUser.id
          ? { ...user, username: formData.username }
          : user
      )
    );

    const isEditingAdmin = editingUser.role === "admin";

    toast.success(
      `Usuario actualizado correctamente${
        formData.password ? " (incluyendo contraseña)" : ""
      }${isEditingAdmin ? ". Cerrando sesión..." : ""}`
    );

    handleCloseDialog();

    // Si se editó un admin, cerrar sesión después de un breve delay
    if (isEditingAdmin) {
      setTimeout(() => {
        logout();
        toast.info("Sesión cerrada por cambios en cuenta de administrador");
      }, 1500);
    }
  };

  const getRoleIcon = (role: "admin" | "user") => {
    return role === "admin" ? (
      <AdminIcon sx={{ fontSize: 16 }} />
    ) : (
      <PersonIcon sx={{ fontSize: 16 }} />
    );
  };

  const getRoleColor = (role: "admin" | "user") => {
    return role === "admin" ? "error" : "primary";
  };

  if (!isAdmin) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Acceso Denegado
        </Typography>
        Solo los administradores pueden gestionar usuarios.
      </Alert>
    );
  }

  return (
    <Box>
      <Card
        sx={{
          background: darkMode
            ? "linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%)"
            : "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
          border: darkMode ? "1px solid #6b7280" : "1px solid #E2E8F0",
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: "text.primary",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              👥 Gestión de Usuarios
            </Typography>
            <Chip
              label={`${users.length} usuarios`}
              color="primary"
              size="small"
              sx={{ fontWeight: 500 }}
            />
          </Box>

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 4,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 2,
                background: darkMode
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.02)",
                border: darkMode
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      background: darkMode
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.04)",
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Rol</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      ✏️
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      sx={{
                        "&:hover": {
                          background: darkMode
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.02)",
                        },
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, color: "text.primary" }}
                        >
                          {user.username}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getRoleIcon(user.role)}
                          label={user.role}
                          color={getRoleColor(user.role)}
                          size="small"
                          sx={{ fontWeight: 500, textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleEditUser(user)}
                          sx={{
                            color: "primary.main",
                            "&:hover": {
                              background: darkMode
                                ? "rgba(59, 130, 246, 0.1)"
                                : "rgba(59, 130, 246, 0.05)",
                            },
                          }}
                          title="Editar usuario"
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Alert
            severity="info"
            sx={{
              mt: 3,
              borderRadius: 2,
              background: darkMode
                ? "rgba(59, 130, 246, 0.1)"
                : "rgba(59, 130, 246, 0.05)",
            }}
          >
            <Typography variant="body2">
              <strong>Nota:</strong> Si modificas un usuario administrador, la
              sesión se cerrará automáticamente por seguridad. Los usuarios
              regulares se pueden editar sin afectar la sesión actual.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Dialog para editar usuario */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: darkMode
              ? "linear-gradient(135deg, #374151 0%, #4b5563 100%)"
              : "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            ✏️ Editar Usuario: {editingUser?.username}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              fullWidth
              required
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  background: darkMode
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.02)",
                },
              }}
            />
            <TextField
              label="Nueva Contraseña (opcional)"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              fullWidth
              variant="outlined"
              helperText="Deja vacío si no quieres cambiar la contraseña (mínimo 4 caracteres)"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      sx={{
                        color: darkMode ? "#9ca3af" : "#6b7280",
                        "&:hover": {
                          color: darkMode ? "#d1d5db" : "#374151",
                        },
                      }}
                    >
                      {showPassword ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  background: darkMode
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.02)",
                },
              }}
            />
            {formData.password && (
              <TextField
                label="Confirmar Nueva Contraseña"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                fullWidth
                required
                variant="outlined"
                error={
                  formData.confirmPassword !== "" &&
                  formData.password !== formData.confirmPassword
                }
                helperText={
                  formData.confirmPassword !== "" &&
                  formData.password !== formData.confirmPassword
                    ? "Las contraseñas no coinciden"
                    : ""
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleToggleConfirmPasswordVisibility}
                        edge="end"
                        sx={{
                          color: darkMode ? "#9ca3af" : "#6b7280",
                          "&:hover": {
                            color: darkMode ? "#d1d5db" : "#374151",
                          },
                        }}
                      >
                        {showConfirmPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    background: darkMode
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.02)",
                  },
                }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            startIcon={<CancelIcon />}
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ borderRadius: 2 }}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersForm;
