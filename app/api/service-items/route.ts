import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://api.gtvmotor.dev'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('service_id')
    
    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 })
    }

    const response = await fetch(`${API_BASE_URL}/api/service-items?service_id=${serviceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Service items GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch service items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: 'Service items data is required' }, { status: 400 })
    }

    const response = await fetch(`${API_BASE_URL}/api/service-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Service items POST error:', error)
    return NextResponse.json({ error: 'Failed to create service items' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const response = await fetch(`${API_BASE_URL}/api/service-items`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Service items PUT error:', error)
    return NextResponse.json({ error: 'Failed to update service item' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const response = await fetch(`${API_BASE_URL}/api/service-items?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Service items DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete service item' }, { status: 500 })
  }
}
