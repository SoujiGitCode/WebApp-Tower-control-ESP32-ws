import { Box, Typography, Button } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NumbersIcon from '@mui/icons-material/Numbers';
import PowerIcon from '@mui/icons-material/Power';
import CellTowerIcon from '@mui/icons-material/CellTower';
import BadgeIcon from '@mui/icons-material/Badge';

const TowerInfo = ({ onContinue }: { onContinue: () => void }) => {
    return (
        <Box
            sx={{
                padding: 2,
                backgroundColor: 'background.paper',
                color: 'text.primary',
                borderRadius: 2,
                boxShadow: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,  // Espacio entre elementos
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
                <BadgeIcon sx={{ mr: 1 }} />
                <Typography variant="body1"><strong>Identificador:</strong> Torre-1234</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
                <LocationOnIcon sx={{ mr: 1 }} />
                <Typography variant="body1"><strong>Ubicación:</strong> Lat: -34.6037, Lon: -58.3816</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
                <NumbersIcon sx={{ mr: 1 }} />
                <Typography variant="body1"><strong>Número:</strong> 12345</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
                <PowerIcon sx={{ mr: 1 }} />
                <Typography variant="body1"><strong>Tipo:</strong> Alta Tensión</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
                <CellTowerIcon sx={{ mr: 1 }} />
                <Typography variant="body1"><strong>Cantidad de Celdas:</strong> 4</Typography>
            </Box>
            <Button variant="contained" color="primary" onClick={onContinue} sx={{ marginTop: 2, alignSelf: 'center' }}>
                Continuar
            </Button>
        </Box>
    );
};

export default TowerInfo;
