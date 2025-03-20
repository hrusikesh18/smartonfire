import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { 
    Science as ScienceIcon,
    Height as HeightIcon,
    Scale as ScaleIcon,
    Favorite as HeartIcon,
    Thermostat as ThermostatIcon 
} from '@mui/icons-material';

const VitalSigns = () => {
    const [vitalSigns, setVitalSigns] = useState([]);

    const getVitalSignValue = (code) => {
        const observation = vitalSigns.find(obs => {
            if (code === 'blood-pressure') {
                return obs.resource?.code?.coding?.[0]?.code === '85354-9' || 
                       obs.resource?.code?.coding?.[0]?.code === '55284-4';
            }
            if (code === 'temperature') {
                return obs.resource?.code?.coding?.[0]?.code === '8310-5' || 
                       obs.resource?.code?.coding?.[0]?.code === '8331-1';
            }
            return obs.resource?.code?.coding?.[0]?.code === code;
        });

        if (!observation) return 'No data';

        if (code === 'blood-pressure') {
            const systolic = observation.resource?.component?.find(c => c.code.coding[0].code === '8480-6')?.valueQuantity?.value;
            const diastolic = observation.resource?.component?.find(c => c.code.coding[0].code === '8462-4')?.valueQuantity?.value;
            if (systolic && diastolic) {
                return `${Number(systolic).toFixed(2)}/${Number(diastolic).toFixed(2)} mmHg`;
            }
            return 'No data';
        }

        const value = observation.resource?.valueQuantity?.value;
        const unit = observation.resource?.valueQuantity?.unit;

        if (!value) return 'No data';
        return `${Number(value).toFixed(2)} ${unit || ''}`.trim();
    };

    useEffect(() => {
        const fetchVitalSigns = async () => {
            try {
                const token = sessionStorage.getItem('smart_token');
                const fhirBaseUrl = sessionStorage.getItem('fhir_base_url');
                const patientId = sessionStorage.getItem('patient_id');
                
                if (!token || !fhirBaseUrl || !patientId) {
                    return;
                }

                const vitalSignCodes = [
                    '8302-2',    // Height
                    '29463-7',   // Weight
                    '85354-9',   // Blood Pressure Panel
                    '55284-4',   // Blood Pressure
                    '8310-5',    // Body temperature
                    '8331-1'     // Oral temperature
                ];

                const requests = vitalSignCodes.map(code => 
                    fetch(`${fhirBaseUrl}/Observation?patient=${patientId}&code=${code}&_sort=-date&_count=1`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json+fhir'
                        }
                    })
                );

                const responses = await Promise.all(requests);
                const results = await Promise.all(responses.map(async response => {
                    if (!response.ok) return { entry: [] };
                    return response.json();
                }));

                const allVitals = results.flatMap(result => result.entry || []);
                setVitalSigns(allVitals);
            } catch (error) {
                console.error('Error fetching vital signs:', error);
            }
        };

        fetchVitalSigns();
    }, []);

    return (
        <Card sx={{ mb: 3, boxShadow: 3 }}>
            <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                    <ScienceIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h5">Vital Signs</Typography>
                </Box>
                <Box display="flex" gap={3} flexWrap="wrap">
                    <Card variant="outlined" sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <HeightIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="subtitle1" fontWeight="medium">Height</Typography>
                            </Box>
                            <Typography variant="h6">{getVitalSignValue('8302-2')}</Typography>
                        </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <ScaleIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="subtitle1" fontWeight="medium">Weight</Typography>
                            </Box>
                            <Typography variant="h6">{getVitalSignValue('29463-7')}</Typography>
                        </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <HeartIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="subtitle1" fontWeight="medium">Blood Pressure</Typography>
                            </Box>
                            <Typography variant="h6">{getVitalSignValue('blood-pressure')}</Typography>
                        </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ flex: '1 1 200px', minWidth: 200 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <ThermostatIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="subtitle1" fontWeight="medium">Body Temperature</Typography>
                            </Box>
                            <Typography variant="h6">{getVitalSignValue('temperature')}</Typography>
                        </CardContent>
                    </Card>
                </Box>
            </CardContent>
        </Card>
    );
};

export default VitalSigns; 