import { useState, useEffect } from 'react'

import { initiateLogin, handleCallback, getCurrentPatient } from './utils/smartAuth'
import Dashboard from './components/Dashboard'

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
    const storedToken = sessionStorage.getItem('smart_token')
    if (storedToken) {
      setAccessToken(storedToken)
      setIsAuthenticated(true)
      getCurrentPatient()
        .then(setUserInfo)
        .catch((err) => {
          console.error('Error fetching user info:', err)
          sessionStorage.removeItem('smart_token')
          setIsAuthenticated(false)
          setAccessToken(null)
        })
      return
    }

    // Handle SMART launch sequence
    if (launch && iss) {
      initiateLogin()
    } else if (code && state) {
      handleCallback(code, state)
        .then(async (tokenData) => {
          setAccessToken(tokenData.access_token)
          setIsAuthenticated(true)
          try {
            const userData = await getCurrentPatient()
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

  if (error) {
    return <div style={{ margin: 0, padding: 0 }}>Error: {error}</div>
  }

  return (
    <div style={{ 
      margin: 0, 
      padding: 0,
      minHeight: '100vh',
      width: '100%'
    }}>
      {isAuthenticated ? (
        <Dashboard />
      ) : (
        <div>Please wait while we authenticate...</div>
      )}
    </div>
  )
}

export default App
