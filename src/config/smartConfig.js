export const SMART_CONFIG = {
    FHIR_BASE_URL: 'https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca',
    AUTH_URL: 'https://authorization.sandboxcerner.com/tenants/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca/protocols/oauth2/profiles/smart-v1/personas/patient/authorize',
    TOKEN_URL: 'https://authorization.sandboxcerner.com/tenants/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca/protocols/oauth2/profiles/smart-v1/token',

    CLIENT_ID: '2560539b-11f4-493c-85e6-6d2ed04a1557',
    REDIRECT_URI: 'http://localhost:5173',
    SCOPE: 'launch/patient openid profile patient/Patient.read patient/Observation.read'
}; 