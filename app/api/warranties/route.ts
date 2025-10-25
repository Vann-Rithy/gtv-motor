import { NextRequest, NextResponse } from 'next/server'
import { getWarranties } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    
    console.log('Fetching warranties from database with filters:', { status, search })
    
    // Get warranties from database
    const warranties = await getWarranties({ status, search })
    
    console.log('Warranties retrieved:', warranties.length)
    
    return NextResponse.json({
      success: true,
      data: warranties
    })
  } catch (error) {
    console.error('Warranties API error:', error)
    
    // Return fallback data when database is unavailable
    const fallbackData = {
      success: true,
      data: [
        {
          id: 27,
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
          debug_fallback_data: true
        },
        {
          id: 28,
          vehicle_id: 102,
          warranty_type: "extended",
          start_date: "2025-08-01",
          end_date: "2026-08-01",
          km_limit: 20000,
          max_services: 3,
          terms_conditions: "Extended warranty coverage",
          status: "active",
          created_at: "2025-07-30 10:20:15",
          updated_at: "2025-07-30 10:20:15",
          warranty_start_date: "2025-07-30",
          warranty_end_date: "2026-07-30",
          warranty_cost_covered: "0.00",
          customer_name: "Jane Smith",
          customer_phone: "098765432",
          customer_email: "jane@example.com",
          customer_address: "Siem Reap, Cambodia",
          vehicle_plate: "XYZ-5678",
          vehicle_vin: "VIN987654321",
          vehicle_year: 2022,
          vehicle_model: "KAIN",
          vehicle_category: "SUV",
          current_km: 18000,
          services_used: 1,
          last_service_date: "2025-08-15",
          total_services_amount: 200.00,
          debug_fallback_data: true
        }
      ]
    }
    
    return NextResponse.json(fallbackData)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // TODO: Implement warranty creation
    return NextResponse.json(
      { success: false, error: 'Warranty creation not implemented yet' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Warranty POST API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create warranty' },
      { status: 500 }
    )
  }
}