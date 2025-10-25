import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://api.gtvmotor.dev'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CUSTOMER API DEBUG START ===')
    
    const body = await request.json()
    console.log('Request body received:', JSON.stringify(body, null, 2))
    
    // Test if the public server is reachable
    console.log('Testing connection to:', API_BASE_URL)
    
    const response = await fetch(`${API_BASE_URL}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    })

    console.log('Response status:', response.status)
    console.log('Response statusText:', response.statusText)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('Raw response text:', responseText)

    if (!response.ok) {
      console.error('API Error - Status:', response.status)
      console.error('API Error - Response:', responseText)
      
      // Try to parse error response
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { message: responseText }
      }
      
      return NextResponse.json({ 
        error: 'Failed to create customer', 
        status: response.status,
        details: errorData,
        originalResponse: responseText
      }, { status: response.status })
    }

    // Try to parse success response
    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      data = { message: 'Success', raw: responseText }
    }
    
    console.log('Success response:', data)
    console.log('=== CUSTOMER API DEBUG END ===')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('=== CUSTOMER API ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('=== END ERROR ===')
    
    return NextResponse.json({ 
      error: 'Failed to create customer', 
      details: error instanceof Error ? error.message : 'Unknown error',
      type: typeof error
    }, { status: 500 })
  }
}