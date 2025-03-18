import { useState, useEffect } from 'react'

import { initiateLogin, handleCallback, getUserInfo } from './utils/smartAuth'
import PatientDetail from './components/PatientDetail'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [error, setError] = useState(null)
  const [accessToken, setAccessToken] = useState(null)

  useEffect(() => {
    // Check for launch parameters first
    const urlParams = new URLSearchParams(window.location.search)
    const launch = urlParams.get('launch')
    const iss = urlParams.get('iss')
    const code = urlParams.get('code')
    const state = urlParams.get('state')

    // Check if we have a stored token
    const storedToken = sessionStorage.getItem('access_token')
    if (storedToken) {
      setAccessToken(storedToken)
      setIsAuthenticated(true)
      getUserInfo(storedToken)
        .then(setUserInfo)
        .catch((err) => {
          console.error('Error fetching user info:', err)
          // If token is invalid, clear it and start over
          sessionStorage.removeItem('access_token')
          setIsAuthenticated(false)
          setAccessToken(null)
        })
      return
    }

    // Handle SMART launch sequence
    if (launch && iss) {
      initiateLogin()
    } else if (code && state) {
      // Handle callback with authorization code
      handleCallback(code, state)
        .then(async (tokenData) => {
          setAccessToken(tokenData.access_token)
          setIsAuthenticated(true)
          try {
            const userData = await getUserInfo(tokenData.access_token)
            setUserInfo(userData)
          } catch (err) {
            console.error('Error fetching user info:', err)
          }
        })
        .catch((err) => {
          setError(err.message)
        })
    }
  }, [])

  const handleLoginClick = () => {
    initiateLogin()
  }

  const handleLogout = () => {
    sessionStorage.removeItem('access_token')
    setIsAuthenticated(false)
    setUserInfo(null)
    setAccessToken(null)
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div className="App">
      <h1>SMART on FHIR App</h1>
      {!isAuthenticated ? (
        <button onClick={handleLoginClick}>Login with Cerner</button>
      ) : (
        <div>
          <div className="user-info">
            <h2>Welcome, {userInfo?.name?.full || `${userInfo?.name?.given || ''} ${userInfo?.name?.family || ''}`.trim() || 'User'}</h2>
            <button onClick={handleLogout}>Logout</button>
          </div>
          {accessToken && <PatientDetail />}
        </div>
      )}
    </div>
  )
}

export default App
