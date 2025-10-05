import { Box, Chip, Typography } from "@mui/material";
import { BugReport as MockIcon } from "@mui/icons-material";
import { useAppContext } from "../../context/AppContext";
import { MOCK_CREDENTIALS } from "../../api/mockApi";

const DevModeIndicator = () => {
  const { devMode } = useAppContext();

  if (!devMode) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 1300,
        backgroundColor: "rgba(255, 152, 0, 0.9)",
        color: "white",
        padding: 2,
        borderRadius: 2,
        minWidth: 200,
        boxShadow: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <MockIcon fontSize="small" />
        <Chip
          label="MOCK API ACTIVO"
          size="small"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            color: "white",
            fontWeight: "bold",
          }}
        />
      </Box>

      <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
        <strong>Credenciales de prueba:</strong>
      </Typography>
      <Typography variant="caption" display="block">
        Admin: {MOCK_CREDENTIALS.admin.username} /{" "}
        {MOCK_CREDENTIALS.admin.password}
      </Typography>
      <Typography variant="caption" display="block">
        User: {MOCK_CREDENTIALS.user.username} /{" "}
        {MOCK_CREDENTIALS.user.password}
      </Typography>
    </Box>
  );
};

export default DevModeIndicator;
