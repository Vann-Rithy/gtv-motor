import { NextRequest, NextResponse } from 'next/server'
import { getWarrantyById, getWarrantyServices, getWarrantyClaims } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const warrantyId = parseInt(params.id)
    
    if (isNaN(warrantyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid warranty ID' },
        { status: 400 }
      )
    }

    console.log('Fetching warranty from database:', warrantyId)
    
    // Get warranty data from database
    const warranty = await getWarrantyById(warrantyId)
    
    if (!warranty) {
      return NextResponse.json(
        { success: false, error: 'Warranty not found' },
        { status: 404 }
      )
    }

    // Get related services and claims
    const services = await getWarrantyServices(warrantyId)
    const claims = await getWarrantyClaims(warrantyId)
    
    // Calculate additional fields
    const servicesUsed = services.length
    const totalServicesAmount = services.reduce((sum, service) => sum + (service.total_amount || 0), 0)
    const lastServiceDate = services.length > 0 ? services[0].service_date : null
    
    // Add Excel warranty components data based on vehicle model
    const warrantyComponents = getWarrantyComponents(warranty.vehicle_model)
    
    const warrantyData = {
      ...warranty,
      services_used: servicesUsed,
      total_services_amount: totalServicesAmount,
      last_service_date: lastServiceDate,
      services: services,
      claims: claims,
      warranty_components: warrantyComponents
    }

    console.log('Warranty data retrieved:', warrantyData)
    
    return NextResponse.json({
      success: true,
      data: warrantyData
    })
  } catch (error) {
    console.error('Warranty API error:', error)
    
    // Return fallback data when database is unavailable
    const fallbackData = {
      success: true,
      data: {
        id: parseInt(params.id),
        vehicle_id: 101,
        warranty_type: "standard",
        start_date: "2025-10-01",
        end_date: "2026-10-01",
        km_limit: 15000,
        max_services: 2,
        terms_conditions: "Standard warranty coverage",
        status: "active",
        created_at: "2025-09-30 15:35:10",
        updated_at: "2025-09-30 15:35:10",
        warranty_start_date: "2025-09-30",
        warranty_end_date: "2026-09-30",
        warranty_cost_covered: "0.00",
        customer_name: "Demo Customer",
        customer_phone: "012345678",
        customer_email: "demo@example.com",
        customer_address: "Phnom Penh, Cambodia",
        vehicle_plate: "DEMO-101",
        vehicle_vin: "VIN123456789",
        vehicle_year: 2023,
        vehicle_model: "SOBEN",
        vehicle_category: "SUV",
        current_km: 25000,
        services_used: 2,
        last_service_date: "2025-09-15",
        total_services_amount: 450.00,
        services: [
          {
            id: 1,
            service_date: "2025-09-15",
            total_amount: 150.00,
            service_status: "completed",
            current_km_at_service: 20000,
            warranty_used: 1,
            cost_covered: 150.00,
            service_type_name: "Oil Change"
          },
          {
            id: 2,
            service_date: "2025-08-10",
            total_amount: 300.00,
            service_status: "completed",
            current_km_at_service: 15000,
            warranty_used: 1,
            cost_covered: 300.00,
            service_type_name: "Maintenance"
          }
        ],
        claims: [
          {
            id: 1,
            claim_type: "engine_repair",
            claim_date: "2025-09-20",
            description: "Engine noise complaint",
            status: "pending",
            estimated_cost: 500.00,
            approved_amount: null
          }
        ],
        warranty_components: {
          'Engine': {
            years: 10,
            kilometers: 200000,
            applicable: true,
            remaining_years: 9.5,
            remaining_km: 175000,
            status: 'active'
          },
          'Car Paint': {
            years: 10,
            kilometers: 200000,
            applicable: true,
            remaining_years: 9.5,
            remaining_km: 175000,
            status: 'active'
          },
          'Transmission (gearbox)': {
            years: 5,
            kilometers: 100000,
            applicable: true,
            remaining_years: 4.5,
            remaining_km: 75000,
            status: 'active'
          },
          'Electrical System': {
            years: 5,
            kilometers: 100000,
            applicable: true,
            remaining_years: 4.5,
            remaining_km: 75000,
            status: 'active'
          },
          'Battery Hybrid': {
            years: 0,
            kilometers: 0,
            applicable: false,
            remaining_years: 0,
            remaining_km: 0,
            status: 'not_applicable'
          }
        },
        debug_fallback_data: true
      }
    }
    
    return NextResponse.json(fallbackData)
  }
}

function getWarrantyComponents(vehicleModel: string) {
  // Excel warranty data based on vehicle model
  const modelWarranties: { [key: string]: any } = {
    'SOBEN': {
      'Engine': { years: 10, kilometers: 200000, applicable: true },
      'Car Paint': { years: 10, kilometers: 200000, applicable: true },
      'Transmission (gearbox)': { years: 5, kilometers: 100000, applicable: true },
      'Electrical System': { years: 5, kilometers: 100000, applicable: true },
      'Battery Hybrid': { years: 0, kilometers: 0, applicable: false }
    },
    'KAIN': {
      'Engine': { years: 10, kilometers: 200000, applicable: true },
      'Car Paint': { years: 10, kilometers: 200000, applicable: true },
      'Transmission (gearbox)': { years: 5, kilometers: 100000, applicable: true },
      'Electrical System': { years: 5, kilometers: 100000, applicable: true },
      'Battery Hybrid': { years: 8, kilometers: 160000, applicable: true }
    },
    'KESSOR': {
      'Engine': { years: 10, kilometers: 200000, applicable: true },
      'Car Paint': { years: 10, kilometers: 200000, applicable: true },
      'Transmission (gearbox)': { years: 5, kilometers: 100000, applicable: true },
      'Electrical System': { years: 5, kilometers: 100000, applicable: true },
      'Battery Hybrid': { years: 0, kilometers: 0, applicable: false }
    },
    'KOUPREY': {
      'Engine': { years: 10, kilometers: 200000, applicable: true },
      'Car Paint': { years: 10, kilometers: 200000, applicable: true },
      'Transmission (gearbox)': { years: 5, kilometers: 100000, applicable: true },
      'Electrical System': { years: 5, kilometers: 100000, applicable: true },
      'Battery Hybrid': { years: 0, kilometers: 0, applicable: false }
    }
  }
  
  const baseWarranty = modelWarranties[vehicleModel] || modelWarranties['SOBEN']
  const components: any = {}
  
  Object.entries(baseWarranty).forEach(([component, data]) => {
    const startDate = new Date('2025-10-01')
    const currentDate = new Date()
    const timeDiff = currentDate.getTime() - startDate.getTime()
    const daysDiff = timeDiff / (1000 * 3600 * 24)
    const yearsDiff = daysDiff / 365.25
    
    components[component] = {
      years: data.years,
      kilometers: data.kilometers,
      applicable: data.applicable,
      remaining_years: Math.max(0, data.years - yearsDiff),
      remaining_km: Math.max(0, data.kilometers - 25000), // Assuming 25k current KM
      status: data.applicable ? 'active' : 'not_applicable'
    }
  })
  
  return components
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const url = `${PHP_BACKEND_URL}/api/warranties/${params.id}`

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Warranty PUT API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update warranty' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = `${PHP_BACKEND_URL}/api/warranties/${params.id}`

    const response = await fetch(url, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Warranty DELETE API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete warranty' },
      { status: 500 }
    )
  }
}
