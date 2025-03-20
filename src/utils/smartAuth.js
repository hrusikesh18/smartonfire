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

// Function to start the login process
export const initiateLogin = async () => {
    try {
        const state = crypto.randomUUID();
        sessionStorage.setItem('smart_state', state);

        const urlParams = new URLSearchParams(window.location.search);
        const launch = urlParams.get('launch');
        const iss = urlParams.get('iss');

        let authUrl = SMART_CONFIG.AUTH_URL;
        let tokenUrl = SMART_CONFIG.TOKEN_URL;
        let fhirBaseUrl = SMART_CONFIG.FHIR_BASE_URL;

        if (iss) {
            try {
                sessionStorage.setItem('iss_url', iss);
                fhirBaseUrl = iss;

                const config = await fetchSmartConfiguration(iss);
                authUrl = config.authorization_endpoint;
                tokenUrl = config.token_endpoint;
                
                sessionStorage.setItem('token_url', tokenUrl);
            } catch (error) {
                console.error('Error during endpoint discovery:', error);
                authUrl = SMART_CONFIG.AUTH_URL;
                tokenUrl = SMART_CONFIG.TOKEN_URL;
            }
        }

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: SMART_CONFIG.CLIENT_ID,
            redirect_uri: SMART_CONFIG.REDIRECT_URI,
            scope: launch ? `launch ${SMART_CONFIG.SCOPE}` : SMART_CONFIG.SCOPE,
            state: state,
            aud: fhirBaseUrl
        });

        if (launch) {
            params.append('launch', launch);
        }

        const loginUrl = `${authUrl}?${params.toString()}`;
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
        const fhirBaseUrl = sessionStorage.getItem('fhir_base_url');
        const patientId = sessionStorage.getItem('patient_id');
        
        if (!token || !fhirBaseUrl) {
            throw new Error('No access token or FHIR server URL found');
        }

        const endpoint = patientId ? 
            `${fhirBaseUrl}/Patient/${patientId}` : 
            `${fhirBaseUrl}/Patient`;

        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json+fhir'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch patient: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const patient = data.resourceType === 'Bundle' ? data.entry?.[0]?.resource : data;
        
        if (!patient) {
            throw new Error('No patient data found');
        }

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
            email: patient.telecom?.find(t => t.system === 'email')?.value || ''
        };

        sessionStorage.setItem('current_patient', JSON.stringify(formattedPatient));
        return formattedPatient;
    } catch (error) {
        console.error('Failed to get current patient:', error);
        throw error;
    }
};

// Function to handle the callback from SMART auth
export const handleCallback = async (code, state) => {
    try {
        const savedState = sessionStorage.getItem('smart_state');
        if (state !== savedState) {
            throw new Error('State mismatch - security validation failed');
        }

        const tokenUrl = sessionStorage.getItem('token_url') || SMART_CONFIG.TOKEN_URL;

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
            throw new Error('Token exchange failed');
        }

        const tokenData = await tokenResponse.json();
        sessionStorage.setItem('smart_token', tokenData.access_token);
        
        const fhirBaseUrl = sessionStorage.getItem('iss_url') || SMART_CONFIG.FHIR_BASE_URL;
        sessionStorage.setItem('fhir_base_url', fhirBaseUrl);

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