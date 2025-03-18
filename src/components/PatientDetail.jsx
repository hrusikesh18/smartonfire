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
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                Error: {error}
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                No patient data available
            </div>
        );
    }

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Patient Information</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-600">Name</p>
                        <p className="font-semibold">
                            {patient.name?.full || `${patient.name?.given || ''} ${patient.name?.family || ''}`.trim() || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600">Date of Birth</p>
                        <p className="font-semibold">{formatDate(patient.birthDate)}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Gender</p>
                        <p className="font-semibold">{patient.gender || 'N/A'}</p>
                    </div>
                    {patient.address?.full && (
                        <div className="col-span-2">
                            <p className="text-gray-600">Address</p>
                            <p className="font-semibold">{patient.address.full}</p>
                        </div>
                    )}
                    {patient.phone && (
                        <div>
                            <p className="text-gray-600">Phone</p>
                            <p className="font-semibold">{patient.phone}</p>
                        </div>
                    )}
                    {patient.email && (
                        <div>
                            <p className="text-gray-600">Email</p>
                            <p className="font-semibold">{patient.email}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Medications */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Medications</h2>
                {medications.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {medications.map((med, index) => (
                            <li key={index} className="py-4">
                                <p className="font-semibold">{med.resource?.medicationCodeableConcept?.text || 'Unnamed Medication'}</p>
                                <p className="text-gray-600">
                                    Status: {med.resource?.status || 'N/A'}
                                </p>
                                <p className="text-gray-600">
                                    Date: {formatDate(med.resource?.authoredOn)}
                                </p>
                                {med.resource?.dosageInstruction?.[0]?.text && (
                                    <p className="text-gray-600 mt-2">
                                        Instructions: {med.resource.dosageInstruction[0].text}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600">No medications found</p>
                )}
            </div>

            {/* Diagnostic Reports */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Diagnostic Reports</h2>
                {diagnosticReports.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {diagnosticReports.map((report, index) => (
                            <li key={index} className="py-4">
                                <p className="font-semibold">{report.resource?.code?.text || 'Unnamed Report'}</p>
                                <p className="text-gray-600">
                                    Status: {report.resource?.status || 'N/A'}
                                </p>
                                <p className="text-gray-600">
                                    Date: {formatDate(report.resource?.effectiveDateTime)}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600">No diagnostic reports found</p>
                )}
            </div>
        </div>
    );
};

export default PatientDetail; 