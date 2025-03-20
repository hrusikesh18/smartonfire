import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    List, 
    ListItem, 
    ListItemText, 
    Divider 
} from '@mui/material';
import { Vaccines as VaccinesIcon } from '@mui/icons-material';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
};

const Immunizations = () => {
    const [immunizations, setImmunizations] = useState([]);

    useEffect(() => {
        const fetchImmunizations = async () => {
            try {
                const token = sessionStorage.getItem('smart_token');
                const fhirBaseUrl = sessionStorage.getItem('fhir_base_url');
                const patientId = sessionStorage.getItem('patient_id');
                
                if (!token || !fhirBaseUrl || !patientId) {
                    return;
                }

                const response = await fetch(
                    `${fhirBaseUrl}/Immunization?patient=${patientId}&_sort=-date`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json+fhir'
                        }
                    }
                );

                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                setImmunizations(data.entry || []);
            } catch (error) {
                console.error('Error fetching immunizations:', error);
            }
        };

        fetchImmunizations();
    }, []);

    return (
        <Card sx={{ 
            boxShadow: 3, 
            height: '400px', 
            display: 'flex', 
            flexDirection: 'column',
            flex: '1 1 400px',
            minWidth: 300
        }}>
            <CardContent sx={{ flex: '0 0 auto', pb: 0 }}>
                <Box display="flex" alignItems="center" mb={2}>
                    <VaccinesIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h5">Immunizations</Typography>
                </Box>
            </CardContent>
            <CardContent sx={{ 
                flex: '1 1 auto', 
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                    width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '4px',
                    '&:hover': {
                        background: '#666',
                    },
                },
            }}>
                <List>
                    {immunizations.map((imm, index) => (
                        <React.Fragment key={index}>
                            <ListItem>
                                <ListItemText
                                    primary={imm.resource?.vaccineCode?.text || 'Unnamed Vaccine'}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2" color="text.secondary">
                                                Date: {formatDate(imm.resource?.occurrenceDateTime)}
                                            </Typography>
                                            {imm.resource?.note?.[0]?.text && (
                                                <>
                                                    <br />
                                                    <Typography component="span" variant="body2" color="text.secondary">
                                                        Notes: {imm.resource.note[0].text}
                                                    </Typography>
                                                </>
                                            )}
                                        </>
                                    }
                                />
                            </ListItem>
                            {index < immunizations.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                    {immunizations.length === 0 && (
                        <ListItem>
                            <ListItemText primary="No immunizations found" />
                        </ListItem>
                    )}
                </List>
            </CardContent>
        </Card>
    );
};

export default Immunizations; 