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
  Grid,
  Divider,
  useTheme,
  useMediaQuery,
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
import { api, User } from "../../api/index";
import { toast } from "react-toastify";

interface UserLocal {
  id: number;
  username: string;
  role: "admin" | "user";
  isActive: boolean;
}

const UsersForm = () => {
  const { darkMode, isAdmin, logout, currentApi } = useAppContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [users, setUsers] = useState<UserLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserLocal | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cargar usuarios desde la API
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔍 Cargando usuarios desde la API...");
      const response = await currentApi.getUsers();
      console.log("📋 Respuesta de getUsers():", response);
      
      if (response.status === "success" && response.data) {
        // Convertir los usuarios de la API al formato local
        const usersWithId: UserLocal[] = response.data.map((user, index) => ({
          id: index + 1, // Asignar ID secuencial ya que la API no tiene ID
          username: user.username,
          role: user.role === "ADMIN" ? "admin" : "user",
          isActive: user.isActive,
        }));
        
        console.log(`✅ ${usersWithId.length} usuarios cargados:`, usersWithId);
        setUsers(usersWithId);
      } else {
        console.error("❌ Error en respuesta de usuarios:", response);
        setError(response.message || "Error al cargar usuarios");
        toast.error(response.message || "Error al cargar usuarios");
      }
    } catch (err) {
      console.error("❌ Error cargando usuarios:", err);
      setError("Error de conexión al cargar usuarios");
      toast.error("Error de conexión al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [currentApi, isAdmin]);

  const handleEditUser = (user: UserLocal) => {
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

  const handleSaveUser = async () => {
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

    try {
      setLoading(true);
      
      // Llamar a la API para actualizar el usuario
      const response = await currentApi.updateUser(
        editingUser.username, // Username original para identificar al usuario
        formData.password || undefined, // Nueva contraseña (opcional)
        editingUser.role === "admin" ? "ADMIN" : "USER", // Rol actual (no se cambia por ahora)
        editingUser.isActive // Estado activo actual
      );

      if (response.status === "success") {
        // Recargar usuarios desde la API para obtener datos actualizados
        await loadUsers();

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
      } else {
        toast.error(response.message || "Error al actualizar usuario");
      }
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      toast.error("Error de conexión al actualizar usuario");
    } finally {
      setLoading(false);
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

  // Componente UserCard para vista móvil
  const UserCard = ({ user }: { user: UserLocal }) => (
    <Card
      sx={{
        mb: 2,
        background: darkMode
          ? "rgba(255,255,255,0.05)"
          : "rgba(0,0,0,0.02)",
        border: darkMode
          ? "1px solid rgba(255,255,255,0.1)"
          : "1px solid rgba(0,0,0,0.05)",
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          background: darkMode
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.04)",
          transform: 'translateY(-1px)',
          boxShadow: darkMode
            ? '0 4px 12px rgba(0,0,0,0.3)'
            : '0 4px 12px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 2 
        }}>
          <Typography
            variant="h6"
            sx={{ 
              fontWeight: 600, 
              color: "text.primary",
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            {user.username}
          </Typography>
          <IconButton
            onClick={() => handleEditUser(user)}
            sx={{
              color: "primary.main",
              backgroundColor: darkMode
                ? "rgba(59, 130, 246, 0.1)"
                : "rgba(59, 130, 246, 0.05)",
              "&:hover": {
                backgroundColor: darkMode
                  ? "rgba(59, 130, 246, 0.2)"
                  : "rgba(59, 130, 246, 0.1)",
                transform: 'scale(1.05)',
              },
              width: { xs: 40, sm: 44 },
              height: { xs: 40, sm: 44 },
            }}
            title="Editar usuario"
          >
            <EditIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
          </IconButton>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                variant="body2"
                sx={{ 
                  fontWeight: 500, 
                  color: "text.secondary",
                  minWidth: { xs: '60px', sm: '70px' }
                }}
              >
                Rol:
              </Typography>
              <Chip
                icon={getRoleIcon(user.role)}
                label={user.role}
                color={getRoleColor(user.role)}
                size="small"
                sx={{ 
                  fontWeight: 500, 
                  textTransform: "capitalize",
                  fontSize: { xs: '0.7rem', sm: '0.8rem' }
                }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{ 
                  fontWeight: 500, 
                  color: "text.secondary",
                  minWidth: { xs: '60px', sm: '70px' }
                }}
              >
                Estado:
              </Typography>
              <Chip
                label={user.isActive ? "Activo" : "Inactivo"}
                color={user.isActive ? "success" : "default"}
                size="small"
                sx={{ 
                  fontWeight: 500,
                  fontSize: { xs: '0.7rem', sm: '0.8rem' }
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

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
        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: { xs: 2, sm: 3 },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 0 }
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
                fontSize: { xs: '1.3rem', sm: '1.5rem' }
              }}
            >
              👥 Gestión de Usuarios
            </Typography>
            <Chip
              label={`${users.length} usuario${users.length !== 1 ? 's' : ''}`}
              color="primary"
              size={isMobile ? "small" : "medium"}
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.85rem' }
              }}
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
          ) : error ? (
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: 2,
                mb: 2
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => loadUsers()}
                >
                  Reintentar
                </Button>
              }
            >
              <Typography variant="body2">
                <strong>Error al cargar usuarios:</strong><br />
                {error}
              </Typography>
            </Alert>
          ) : users.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                No se encontraron usuarios en el sistema.
              </Typography>
            </Alert>
          ) : (
            <>
              {isMobile ? (
                // Vista móvil con cards
                <Box sx={{ mt: 2 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 600, 
                      color: 'text.primary',
                      fontSize: { xs: '1rem', sm: '1.1rem' }
                    }}
                  >
                    📱 Lista de Usuarios ({users.length})
                  </Typography>
                  {users.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </Box>
              ) : (
                // Vista desktop con tabla
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
                        <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
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
                          <TableCell>
                            <Chip
                              label={user.isActive ? "Activo" : "Inactivo"}
                              color={user.isActive ? "success" : "default"}
                              size="small"
                              sx={{ fontWeight: 500 }}
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
            </>
          )}

          <Alert
            severity="info"
            sx={{
              mt: { xs: 2, sm: 3 },
              borderRadius: 2,
              background: darkMode
                ? "rgba(59, 130, 246, 0.1)"
                : "rgba(59, 130, 246, 0.05)",
            }}
          >
            <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
              <strong>Nota:</strong> Si modificas un usuario administrador, la
              sesión se cerrará automáticamente por seguridad. Los usuarios
              regulares se pueden editar sin afectar la sesión actual.
              <br />
              <strong>API:</strong> Los datos se cargan desde el endpoint real{" "}
              <code>/api/users/list</code>
              <br />
              <strong>Vista:</strong> {isMobile ? '📱 Móvil (Cards)' : '🖥️ Desktop (Tabla)'}
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
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            background: darkMode
              ? "linear-gradient(135deg, #374151 0%, #4b5563 100%)"
              : "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
            borderRadius: { xs: 0, sm: 2 },
            m: { xs: 0, sm: 2 },
            height: { xs: '100vh', sm: 'auto' },
            maxHeight: { xs: '100vh', sm: '90vh' }
          },
        }}
      >
        <DialogTitle sx={{ 
          pb: { xs: 2, sm: 2 },
          px: { xs: 3, sm: 3 },
          pt: { xs: 3, sm: 3 },
          borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600,
            fontSize: { xs: '1.2rem', sm: '1.25rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            ✏️ Editar Usuario
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'text.secondary',
            mt: 0.5,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            {editingUser?.username}
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ 
          px: { xs: 3, sm: 3 },
          py: { xs: 3, sm: 3 },
          flex: 1,
          overflow: 'auto'
        }}>
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: { xs: 3, sm: 2.5 },
            width: '100%'
          }}>
            {/* Campo Username */}
            <Box>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                fontWeight: 500, 
                color: 'text.primary',
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}>
                👤 Nombre de Usuario
              </Typography>
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
                    fontSize: { xs: '1rem', sm: '1rem' },
                    height: { xs: 56, sm: 56 }
                  },
                }}
              />
            </Box>

            {/* Campo Nueva Contraseña */}
            <Box>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                fontWeight: 500, 
                color: 'text.primary',
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}>
                🔒 Nueva Contraseña (Opcional)
              </Typography>
              <TextField
                label="Nueva Contraseña"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                fullWidth
                variant="outlined"
                placeholder="Deja vacío para mantener la actual"
                helperText="Mínimo 4 caracteres. Deja vacío si no quieres cambiarla."
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
                          width: 48,
                          height: 48,
                        }}
                      >
                        {showPassword ? (
                          <VisibilityOffIcon sx={{ fontSize: 20 }} />
                        ) : (
                          <VisibilityIcon sx={{ fontSize: 20 }} />
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
                    fontSize: { xs: '1rem', sm: '1rem' },
                    height: { xs: 56, sm: 56 }
                  },
                  "& .MuiFormHelperText-root": {
                    fontSize: { xs: '0.8rem', sm: '0.8rem' },
                    mt: 1
                  }
                }}
              />
            </Box>

            {/* Campo Confirmar Contraseña - Solo si hay contraseña */}
            {formData.password && (
              <Box>
                <Typography variant="body2" sx={{ 
                  mb: 1, 
                  fontWeight: 500, 
                  color: 'text.primary',
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}>
                  🔒 Confirmar Nueva Contraseña
                </Typography>
                <TextField
                  label="Confirmar Contraseña"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="Repite la nueva contraseña"
                  error={
                    formData.confirmPassword !== "" &&
                    formData.password !== formData.confirmPassword
                  }
                  helperText={
                    formData.confirmPassword !== "" &&
                    formData.password !== formData.confirmPassword
                      ? "❌ Las contraseñas no coinciden"
                      : "✅ Confirma tu nueva contraseña"
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
                            width: 48,
                            height: 48,
                          }}
                        >
                          {showConfirmPassword ? (
                            <VisibilityOffIcon sx={{ fontSize: 20 }} />
                          ) : (
                            <VisibilityIcon sx={{ fontSize: 20 }} />
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
                      fontSize: { xs: '1rem', sm: '1rem' },
                      height: { xs: 56, sm: 56 }
                    },
                    "& .MuiFormHelperText-root": {
                      fontSize: { xs: '0.8rem', sm: '0.8rem' },
                      mt: 1
                    }
                  }}
                />
              </Box>
            )}

            {/* Información adicional */}
            <Box sx={{ 
              background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`,
              borderRadius: 2,
              p: 2,
              mt: 1
            }}>
              <Typography variant="body2" sx={{ 
                color: 'primary.main',
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                lineHeight: 1.5
              }}>
                ℹ️ <strong>Información:</strong><br />
                • Rol actual: <strong>{editingUser?.role}</strong><br />
                • Estado: <strong>{editingUser?.isActive ? 'Activo' : 'Inactivo'}</strong><br />
                • Si modificas un admin, la sesión se cerrará por seguridad
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: { xs: 3, sm: 3 }, 
          pt: { xs: 2, sm: 2 },
          gap: { xs: 2, sm: 2 },
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          alignItems: 'stretch',
          borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
        }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            startIcon={<CancelIcon sx={{ fontSize: 20 }} />}
            sx={{ 
              borderRadius: 2,
              py: { xs: 2, sm: 1.5 },
              fontSize: { xs: '1rem', sm: '1rem' },
              fontWeight: 500,
              minHeight: { xs: 56, sm: 48 },
              flex: { xs: 1, sm: 'none' },
              minWidth: { xs: '100%', sm: 120 }
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            startIcon={<SaveIcon sx={{ fontSize: 20 }} />}
            disabled={loading}
            sx={{ 
              borderRadius: 2,
              py: { xs: 2, sm: 1.5 },
              fontSize: { xs: '1rem', sm: '1rem' },
              fontWeight: 'bold',
              minHeight: { xs: 56, sm: 48 },
              flex: { xs: 1, sm: 'none' },
              minWidth: { xs: '100%', sm: 150 },
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              }
            }}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersForm;
