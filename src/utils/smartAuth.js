import { SMART_CONFIG } from '../config/smartConfig';

// Function to fetch SMART configuration
const fetchSmartConfiguration = async (issUrl) => {
    try {
        const response = await fetch(`${issUrl}/.well-known/smart-configuration`);
        if (!response.ok) {
            throw new Error('Failed to fetch SMART configuration');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching SMART configuration:', error);
        return fetchFhirMetadata(issUrl);
    }
};

// Function to fetch FHIR server metadata
const fetchFhirMetadata = async (issUrl) => {
    try {
        const response = await fetch(`${issUrl}/metadata`);
        if (!response.ok) {
            throw new Error('Failed to fetch FHIR metadata');
        }
        const metadata = await response.json();
        
        const security = metadata.rest?.[0]?.security;
        const extensions = security?.extension?.[0]?.extension || [];
        
        const authUrl = extensions.find(ext => ext.url === 'authorize')?.valueUri;
        const tokenUrl = extensions.find(ext => ext.url === 'token')?.valueUri;
        
        if (!authUrl || !tokenUrl) {
            throw new Error('OAuth2 endpoints not found in metadata');
        }
        
        return { 
            authorization_endpoint: authUrl, 
            token_endpoint: tokenUrl 
        };
    } catch (error) {
        console.error('Error fetching FHIR metadata:', error);
        throw error;
    }
};

// Function to generate a random state with sufficient entropy
const generateState = () => {
    return crypto.randomUUID();
};

// Function to start the login process
export const initiateLogin = async () => {
    try {
        // Generate and store state with sufficient entropy
        const state = generateState();
        sessionStorage.setItem('smart_state', state);

        // Get launch context parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const launch = urlParams.get('launch');
        const iss = urlParams.get('iss');

        // Determine the authorization endpoint
        let authUrl = SMART_CONFIG.AUTH_URL;
        let tokenUrl = SMART_CONFIG.TOKEN_URL;
        let fhirBaseUrl = SMART_CONFIG.FHIR_BASE_URL;

        if (iss) {
            try {
                // Store the iss URL for later use
                sessionStorage.setItem('iss_url', iss);
                fhirBaseUrl = iss;

                // Fetch SMART configuration from the iss
                const config = await fetchSmartConfiguration(iss);
                authUrl = config.authorization_endpoint;
                tokenUrl = config.token_endpoint;
                
                // Store the token URL for later use
                sessionStorage.setItem('token_url', tokenUrl);
            } catch (error) {
                console.error('Error during endpoint discovery:', error);
                // Fall back to default endpoints if discovery fails
                authUrl = SMART_CONFIG.AUTH_URL;
                tokenUrl = SMART_CONFIG.TOKEN_URL;
            }
        }

        // Create authorization parameters
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: SMART_CONFIG.CLIENT_ID,
            redirect_uri: SMART_CONFIG.REDIRECT_URI,
            scope: launch ? `launch ${SMART_CONFIG.SCOPE}` : SMART_CONFIG.SCOPE,
            state: state,
            aud: fhirBaseUrl
        });

        // Add launch parameter if in EHR launch flow
        if (launch) {
            params.append('launch', launch);
        }

        // Construct and log the authorization URL
        const loginUrl = `${authUrl}?${params.toString()}`;
        console.log('Initiating SMART login:', loginUrl);
        
        // Redirect to authorization endpoint
        window.location.assign(loginUrl);
    } catch (error) {
        console.error('Login initiation failed:', error);
        throw error;
    }
};

// Function to get current patient context after successful authentication
export const getCurrentPatient = async () => {
    try {
        const token = sessionStorage.getItem('smart_token');
        if (!token) {
            throw new Error('No access token found - please login first');
        }

        const fhirBaseUrl = sessionStorage.getItem('fhir_base_url');
        if (!fhirBaseUrl) {
            throw new Error('No FHIR server URL found');
        }

        // Get patient ID from the token if available
        const patientId = sessionStorage.getItem('patient_id');
        let endpoint = `${fhirBaseUrl}/Patient`;
        
        if (patientId) {
            endpoint = `${fhirBaseUrl}/Patient/${patientId}`;
        }

        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json+fhir',
                'Content-Type': 'application/json+fhir'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch patient:', errorText);
            throw new Error(`Failed to fetch patient: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // If we got a bundle (list of patients), take the first one
        const patient = data.resourceType === 'Bundle' ? data.entry?.[0]?.resource : data;
        
        if (!patient) {
            throw new Error('No patient data found');
        }

        // Format the patient data for display
        const formattedPatient = {
            id: patient.id,
            name: patient.name?.[0] ? {
                given: patient.name[0].given?.join(' ') || '',
                family: patient.name[0].family || '',
                full: `${patient.name[0].given?.join(' ') || ''} ${patient.name[0].family || ''}`.trim()
            } : { given: '', family: '', full: '' },
            gender: patient.gender || 'Unknown',
            birthDate: patient.birthDate || 'Unknown',
            address: patient.address?.[0] ? {
                line: patient.address[0].line?.join(', ') || '',
                city: patient.address[0].city || '',
                state: patient.address[0].state || '',
                postalCode: patient.address[0].postalCode || '',
                full: [
                    patient.address[0].line?.join(', '),
                    patient.address[0].city,
                    patient.address[0].state,
                    patient.address[0].postalCode
                ].filter(Boolean).join(', ')
            } : { line: '', city: '', state: '', postalCode: '', full: '' },
            phone: patient.telecom?.find(t => t.system === 'phone')?.value || '',
            email: patient.telecom?.find(t => t.system === 'email')?.value || '',
            maritalStatus: patient.maritalStatus?.text || '',
            language: patient.communication?.[0]?.language?.text || '',
            raw: patient // Include raw data for complete access
        };

        // Store current patient info in session storage
        sessionStorage.setItem('current_patient', JSON.stringify(formattedPatient));
        console.log('Successfully retrieved patient details:', formattedPatient);
        
        return formattedPatient;
    } catch (error) {
        console.error('Failed to get current patient:', error);
        throw error;
    }
};

// Function to handle the callback from Cerner
export const handleCallback = async (code, state) => {
    try {
        // Verify state
        const savedState = sessionStorage.getItem('smart_state');
        if (state !== savedState) {
            throw new Error('State mismatch - security validation failed');
        }

        // Get the token URL (either from session storage if EHR launch or config if standalone)
        const tokenUrl = sessionStorage.getItem('token_url') || SMART_CONFIG.TOKEN_URL;

        // Exchange code for token
        const tokenResponse = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                client_id: SMART_CONFIG.CLIENT_ID,
                redirect_uri: SMART_CONFIG.REDIRECT_URI
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            throw new Error(`Token exchange failed: ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        sessionStorage.setItem('smart_token', tokenData.access_token);
        
        // Store the FHIR server URL
        const fhirBaseUrl = sessionStorage.getItem('iss_url') || SMART_CONFIG.FHIR_BASE_URL;
        sessionStorage.setItem('fhir_base_url', fhirBaseUrl);

        // If patient ID is included in the token response, store it
        if (tokenData.patient) {
            sessionStorage.setItem('patient_id', tokenData.patient);
        }

        return tokenData;
    } catch (error) {
        console.error('Callback handling failed:', error);
        sessionStorage.removeItem('smart_state');
        throw error;
    }
};

// Function to get a specific patient's details
export const getPatientDetails = async (patientId) => {
    try {
        const token = sessionStorage.getItem('smart_token');
        if (!token) {
            throw new Error('No access token found - please login first');
        }

        const fhirBaseUrl = sessionStorage.getItem('fhir_base_url');
        if (!fhirBaseUrl) {
            throw new Error('No FHIR server URL found');
        }

        if (!patientId) {
            // If no patientId provided, return the current patient
            return getCurrentPatient();
        }

        const response = await fetch(`${fhirBaseUrl}/Patient/${patientId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json+fhir',
                'Content-Type': 'application/json+fhir'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch patient details:', errorText);
            throw new Error(`Failed to fetch patient details: ${response.status} ${response.statusText}`);
        }

        const patient = await response.json();
        
        // Use the same formatting as getCurrentPatient
        const formattedPatient = {
            id: patient.id,
            name: patient.name?.[0] ? {
                given: patient.name[0].given?.join(' ') || '',
                family: patient.name[0].family || '',
                full: `${patient.name[0].given?.join(' ') || ''} ${patient.name[0].family || ''}`.trim()
            } : { given: '', family: '', full: '' },
            gender: patient.gender || 'Unknown',
            birthDate: patient.birthDate || 'Unknown',
            address: patient.address?.[0] ? {
                line: patient.address[0].line?.join(', ') || '',
                city: patient.address[0].city || '',
                state: patient.address[0].state || '',
                postalCode: patient.address[0].postalCode || '',
                full: [
                    patient.address[0].line?.join(', '),
                    patient.address[0].city,
                    patient.address[0].state,
                    patient.address[0].postalCode
                ].filter(Boolean).join(', ')
            } : { line: '', city: '', state: '', postalCode: '', full: '' },
            phone: patient.telecom?.find(t => t.system === 'phone')?.value || '',
            email: patient.telecom?.find(t => t.system === 'email')?.value || '',
            maritalStatus: patient.maritalStatus?.text || '',
            language: patient.communication?.[0]?.language?.text || '',
            raw: patient // Include raw data for complete access
        };

        console.log('Successfully retrieved patient details:', formattedPatient);
        return formattedPatient;
    } catch (error) {
        console.error('Failed to get patient details:', error);
        throw error;
    }
};

// Export getCurrentPatient as the main function for getting patient data
export { getCurrentPatient as getUserInfo };

// Function to fetch patient's medications
export const getPatientMedications = async () => {
    try {
        const token = sessionStorage.getItem('smart_token');
        const fhirBaseUrl = sessionStorage.getItem('fhir_base_url');
        const patientId = sessionStorage.getItem('patient_id');
        
        if (!token || !fhirBaseUrl) {
            throw new Error('No access token or FHIR server URL found');
        }

        if (!patientId) {
            console.log('No patient ID found in session storage');
            return [];
        }

        console.log('Fetching medications for patient:', patientId);
        const response = await fetch(`${fhirBaseUrl}/MedicationRequest?patient=${patientId}&_sort=-_lastUpdated`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json+fhir'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch medications:', response.status, response.statusText, errorText);
            return [];
        }

        const data = await response.json();
        console.log('Successfully fetched medications:', data);
        return data.entry || [];
    } catch (error) {
        console.error('Error fetching medications:', error);
        return [];
    }
};

// Function to fetch patient's diagnostic reports
export const getPatientDiagnosticReports = async () => {
    try {
        const token = sessionStorage.getItem('smart_token');
        const fhirBaseUrl = sessionStorage.getItem('fhir_base_url');
        
        if (!token || !fhirBaseUrl) {
            throw new Error('No access token or FHIR server URL found');
        }

        const response = await fetch(`${fhirBaseUrl}/DiagnosticReport?patient=${sessionStorage.getItem('patient_id')}&_sort=-date`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json+fhir'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch diagnostic reports');
        }

        const data = await response.json();
        return data.entry || [];
    } catch (error) {
        console.error('Error fetching diagnostic reports:', error);
        return [];
    }
}; 