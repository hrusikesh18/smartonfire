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
import { Medication as MedicationIcon } from '@mui/icons-material';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
};

const Medications = () => {
    const [medications, setMedications] = useState([]);

    useEffect(() => {
        const fetchMedications = async () => {
            try {
                const token = sessionStorage.getItem('smart_token');
                const fhirBaseUrl = sessionStorage.getItem('fhir_base_url');
                const patientId = sessionStorage.getItem('patient_id');
                
                if (!token || !fhirBaseUrl || !patientId) {
                    return;
                }

                const response = await fetch(
                    `${fhirBaseUrl}/MedicationRequest?patient=${patientId}&_sort=-_lastUpdated`,
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
                setMedications(data.entry || []);
            } catch (error) {
                console.error('Error fetching medications:', error);
            }
        };

        fetchMedications();
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
                    <MedicationIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h5">Recent Medications</Typography>
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
                    {medications.map((med, index) => (
                        <React.Fragment key={index}>
                            <ListItem>
                                <ListItemText
                                    primary={med.resource?.medicationCodeableConcept?.text || 'Unnamed Medication'}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2" color="text.secondary">
                                                Date: {formatDate(med.resource?.authoredOn)}
                                            </Typography>
                                            {med.resource?.dosageInstruction?.[0]?.text && (
                                                <>
                                                    <br />
                                                    <Typography component="span" variant="body2" color="text.secondary">
                                                        Instructions: {med.resource.dosageInstruction[0].text}
                                                    </Typography>
                                                </>
                                            )}
                                        </>
                                    }
                                />
                            </ListItem>
                            {index < medications.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                    {medications.length === 0 && (
                        <ListItem>
                            <ListItemText primary="No medications found" />
                        </ListItem>
                    )}
                </List>
            </CardContent>
        </Card>
    );
};

export default Medications; 