"use client"

import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AuthStatusPage() {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [sessionCheck, setSessionCheck] = useState<any>(null)
  const [checkingSession, setCheckingSession] = useState(false)

  const checkSession = async () => {
    setCheckingSession(true)
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      const data = await response.json()
      setSessionCheck({
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries())
      })
    } catch (error) {
      setSessionCheck({
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'ERROR'
      })
    } finally {
      setCheckingSession(false)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Authentication Status</h1>
        <div className="flex gap-2">
          <Button onClick={checkSession} disabled={checkingSession} variant="outline">
            {checkingSession ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Refresh Status
          </Button>
          <Button onClick={() => router.push("/")} variant="outline">
            Go to Dashboard
          </Button>
          <Button onClick={() => router.push("/login")} variant="outline">
            Go to Login
          </Button>
        </div>
      </div>

      {/* Authentication State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : isAuthenticated ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            Client-Side Authentication State
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p><strong>Loading:</strong> <Badge variant={loading ? "default" : "secondary"}>{loading ? "Yes" : "No"}</Badge></p>
              <p><strong>Authenticated:</strong> <Badge variant={isAuthenticated ? "default" : "destructive"}>{isAuthenticated ? "Yes" : "No"}</Badge></p>
              <p><strong>User Object:</strong> <Badge variant={user ? "default" : "secondary"}>{user ? "Present" : "Missing"}</Badge></p>
            </div>
            <div className="space-y-2">
              {user && (
                <>
                  <p><strong>User ID:</strong> {user.id}</p>
                  <p><strong>Name:</strong> {user.full_name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> <Badge variant="outline">{user.role}</Badge></p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {checkingSession ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : sessionCheck?.status === 200 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : sessionCheck?.status === 401 ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : sessionCheck?.error ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-gray-500" />
            )}
            Server-Side Session Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionCheck ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Response Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Status:</strong> <Badge variant={sessionCheck.status === 200 ? "default" : sessionCheck.status === 401 ? "secondary" : "destructive"}>{sessionCheck.status || sessionCheck.status}</Badge></p>
                    <p><strong>Success:</strong> <Badge variant={sessionCheck.data?.success ? "default" : "destructive"}>{sessionCheck.data?.success ? "Yes" : "No"}</Badge></p>
                    {sessionCheck.data?.error && (
                      <p><strong>Error:</strong> <span className="text-red-600">{sessionCheck.data.error}</span></p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Response Data</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(sessionCheck.data, null, 2)}
                  </pre>
                </div>
              </div>
              
              {sessionCheck.status === 401 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ 401 Unauthorized - This is Expected!</h4>
                  <p className="text-sm text-yellow-700">
                    A 401 response when not logged in is actually <strong>correct behavior</strong> and indicates the authentication system is working properly. 
                    This means the server is correctly rejecting unauthorized requests.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Click "Refresh Status" to check session</p>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-1">✅ Expected Behavior</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>401 Unauthorized</strong> when not logged in = Security working correctly</li>
                <li>• <strong>200 OK</strong> with user data when properly authenticated</li>
                <li>• <strong>Immediate redirects</strong> to login for unauthorized access</li>
                <li>• <strong>Clear loading states</strong> during authentication checks</li>
              </ul>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-1">🔐 Test Steps</h4>
              <ol className="text-sm text-green-700 space-y-1">
                <li>1. <strong>Clear all cookies</strong> for localhost:3000</li>
                <li>2. <strong>Visit any protected route</strong> (like / or /dashboard)</li>
                <li>3. <strong>Should redirect to /login</strong> immediately</li>
                <li>4. <strong>Login with valid credentials</strong></li>
                <li>5. <strong>Should redirect to intended page</strong></li>
                <li>6. <strong>Try accessing other routes</strong> - should work</li>
                <li>7. <strong>Logout and test again</strong> - should redirect to login</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
