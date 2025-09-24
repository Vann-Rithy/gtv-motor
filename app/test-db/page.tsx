"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, CheckCircle, XCircle } from "lucide-react"

export default function TestDbPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testDatabase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      setTestResults({ error: "Failed to test database" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Database Test</h1>
        <Button onClick={testDatabase} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
          Test Database
        </Button>
      </div>

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResults.error ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Database Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{testResults.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Connection Status</h4>
                    <div className="space-y-2">
                      <p><strong>Connected:</strong> <Badge variant={testResults.connected ? "default" : "destructive"}>{testResults.connected ? "Yes" : "No"}</Badge></p>
                      <p><strong>Database:</strong> {testResults.database}</p>
                      <p><strong>Host:</strong> {testResults.host}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Tables Status</h4>
                    <div className="space-y-2">
                      {testResults.tables && Object.entries(testResults.tables).map(([tableName, exists]: [string, any]) => (
                        <p key={tableName}>
                          <strong>{tableName}:</strong> <Badge variant={exists ? "default" : "destructive"}>{exists ? "Exists" : "Missing"}</Badge>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {testResults.usersTableStructure && (
                  <div>
                    <h4 className="font-semibold mb-2">Users Table Structure</h4>
                    <div className="bg-gray-100 p-3 rounded text-sm">
                      <pre className="overflow-auto max-h-64">
                        {JSON.stringify(testResults.usersTableStructure, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {testResults.sampleUsers && (
                  <div>
                    <h4 className="font-semibold mb-2">Sample Users (First 5)</h4>
                    <div className="bg-gray-100 p-3 rounded text-sm">
                      <pre className="overflow-auto max-h-64">
                        {JSON.stringify(testResults.sampleUsers, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>What This Test Does</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-1">Database Connection</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Tests database connectivity</li>
                <li>• Verifies connection parameters</li>
                <li>• Checks if database is accessible</li>
              </ul>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-1">Table Verification</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Checks if required tables exist</li>
                <li>• Verifies table structure</li>
                <li>• Shows sample data</li>
              </ul>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-1">Troubleshooting</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Identifies missing tables</li>
                <li>• Shows database errors</li>
                <li>• Helps debug registration issues</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
