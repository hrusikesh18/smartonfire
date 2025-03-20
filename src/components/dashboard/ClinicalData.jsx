import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import { LocalHospital as HospitalIcon } from '@mui/icons-material';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
};

const ClinicalData = () => {
    const [latestReport, setLatestReport] = useState(null);
    const [observationResults, setObservationResults] = useState([]);

    const formatObservationValue = (observation) => {
        if (!observation || !observation.valueQuantity) return 'N/A';
        const { value, unit } = observation.valueQuantity;
        return `${Number(value).toFixed(2)} ${unit || ''}`.trim();
    };

    useEffect(() => {
        const fetchClinicalData = async () => {
            try {
                const token = sessionStorage.getItem('smart_token');
                const fhirBaseUrl = sessionStorage.getItem('fhir_base_url');
                const patientId = sessionStorage.getItem('patient_id');
                
                if (!token || !fhirBaseUrl || !patientId) {
                    return;
                }

                // Fetch diagnostic reports
                const response = await fetch(
                    `${fhirBaseUrl}/DiagnosticReport?patient=${patientId}&_sort=-date`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json+fhir'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch diagnostic reports');
                }

                const data = await response.json();
                const reports = data.entry || [];
                
                if (reports.length > 0) {
                    const report = reports[0].resource;
                    setLatestReport(report);

                    // Fetch observations for the report
                    if (report.result) {
                        const observationPromises = report.result.map(async (ref) => {
                            const obsResponse = await fetch(
                                `${fhirBaseUrl}/Observation/${ref.reference.split('/')[1]}`,
                                {
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Accept': 'application/json+fhir'
                                    }
                                }
                            );
                            if (!obsResponse.ok) return null;
                            return obsResponse.json();
                        });

                        const observations = await Promise.all(observationPromises);
                        setObservationResults(observations.filter(obs => obs !== null));
                    }
                }
            } catch (error) {
                console.error('Error fetching clinical data:', error);
            }
        };

        fetchClinicalData();
    }, []);

    if (!latestReport) {
        return null;
    }

    return (
        <Card sx={{ mb: 3, boxShadow: 3 }}>
            <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                    <HospitalIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h5">Latest Clinical Data</Typography>
                </Box>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">Last Checkup</Typography>
                        <Typography variant="body1">
                            {latestReport.code?.text || 'Unnamed Report'} - {formatDate(latestReport.effectiveDateTime)}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" mb={1}>Results</Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Test</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {observationResults.map((observation, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{observation?.code?.text || 'Unknown Test'}</TableCell>
                                            <TableCell>{formatObservationValue(observation)}</TableCell>
                                            <TableCell>{formatDate(observation?.effectiveDateTime)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {observationResults.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">No results available</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                    {latestReport.conclusion && (
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Conclusion</Typography>
                            <Typography variant="body1">{latestReport.conclusion}</Typography>
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default ClinicalData; 