import React from 'react';
import { Box, Card, CardContent, Typography, Stack } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

const PatientInfo = ({ patient }) => {
    if (!patient) return null;

    return (
        <Card sx={{ mb: 3, boxShadow: 3 }}>
            <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h5">Patient Information</Typography>
                </Box>
                <Stack spacing={2}>
                    <Box display="flex" gap={2} flexWrap="wrap">
                        <Box flex={1} minWidth={240}>
                            <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                            <Typography variant="body1">
                                {patient.name?.full || `${patient.name?.given || ''} ${patient.name?.family || ''}`.trim() || 'N/A'}
                            </Typography>
                        </Box>
                        <Box flex={1} minWidth={240}>
                            <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                            <Typography variant="body1">{patient.birthDate || 'N/A'}</Typography>
                        </Box>
                    </Box>
                    <Box display="flex" gap={2} flexWrap="wrap">
                        <Box flex={1} minWidth={240}>
                            <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                            <Typography variant="body1">{patient.gender || 'N/A'}</Typography>
                        </Box>
                        <Box flex={1} minWidth={240}>
                            <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                            <Typography variant="body1">{patient.phone || 'N/A'}</Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                        <Typography variant="body1">{patient.address?.full || 'N/A'}</Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default PatientInfo; 