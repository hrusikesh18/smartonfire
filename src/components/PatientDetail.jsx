import React, { useState, useEffect } from 'react';
import { getCurrentPatient, getPatientMedications, getPatientDiagnosticReports } from '../utils/smartAuth';

const PatientDetail = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [patient, setPatient] = useState(null);
    const [medications, setMedications] = useState([]);
    const [diagnosticReports, setDiagnosticReports] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [patientData, medsData, reportsData] = await Promise.all([
                    getCurrentPatient(),
                    getPatientMedications(),
                    getPatientDiagnosticReports()
                ]);
                setPatient(patientData);
                setMedications(medsData);
                setDiagnosticReports(reportsData);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            < div>
                Loading....
            </div>
        );
    }

    if (error) {
        return (
            <div>
                Error: {error}
            </div>
        );
    }

    if (!patient) {
        return (
            <div>
                No patient data available
            </div>
        );
    }

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    };

    return (
        <div>
            <div>
                <h2>Patient Information</h2>
                <div>
                    <div>
                        <p>Name</p>
                        <p>
                            {patient.name?.full || `${patient.name?.given || ''} ${patient.name?.family || ''}`.trim() || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p>Date of Birth</p>
                        <p>{formatDate(patient.birthDate)}</p>
                    </div>
                    <div>
                        <p>Gender</p>
                        <p>{patient.gender || 'N/A'}</p>
                    </div>
                    {patient.address?.full && (
                        <div>
                            <p>Address</p>
                            <p>{patient.address.full}</p>
                        </div>
                    )}
                    {patient.phone && (
                        <div>
                            <p>Phone</p>
                            <p>{patient.phone}</p>
                        </div>
                    )}
                    {patient.email && (
                        <div>
                            <p>Email</p>
                            <p>{patient.email}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Medications */}
            <div>
                <h2>Medications</h2>
                {medications.length > 0 ? (
                    <ul>
                        {medications.map((med, index) => (
                            <li key={index}>
                                <p>{med.resource?.medicationCodeableConcept?.text || 'Unnamed Medication'}</p>
                                <p>
                                    Status: {med.resource?.status || 'N/A'}
                                </p>
                                <p>
                                    Date: {formatDate(med.resource?.authoredOn)}
                                </p>
                                {med.resource?.dosageInstruction?.[0]?.text && (
                                    <p>
                                        Instructions: {med.resource.dosageInstruction[0].text}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No medications found</p>
                )}
            </div>

            {/* Diagnostic Reports */}
            <div>
                <h2>Diagnostic Reports</h2>
                {diagnosticReports.length > 0 ? (
                    <ul>
                        {diagnosticReports.map((report, index) => (
                            <li key={index}>
                                <p>{report.resource?.code?.text || 'Unnamed Report'}</p>
                                <p>
                                    Status: {report.resource?.status || 'N/A'}
                                </p>
                                <p>
                                    Date: {formatDate(report.resource?.effectiveDateTime)}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No diagnostic reports found</p>
                )}
            </div>
        </div>
    );
};

export default PatientDetail; 