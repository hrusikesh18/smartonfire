import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import PatientInfo from './dashboard/PatientInfo';
import VitalSigns from './dashboard/VitalSigns';
import ClinicalData from './dashboard/ClinicalData';
import Medications from './dashboard/Medications';
import Immunizations from './dashboard/Immunizations';

const Dashboard = () => {
    const [patient, setPatient] = useState(null);

    useEffect(() => {
        const storedPatient = sessionStorage.getItem('current_patient');
        if (storedPatient) {
            setPatient(JSON.parse(storedPatient));
        }
    }, []);

    return (
        <Box sx={{ p: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
            <PatientInfo patient={patient} />
            <VitalSigns />
            <ClinicalData />
            <Box display="flex" gap={3} flexWrap="wrap">
                <Medications />
                <Immunizations />
            </Box>
        </Box>
    );
};

export default Dashboard; 