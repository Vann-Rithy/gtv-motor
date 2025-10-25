import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gtv_motor_php',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

let pool: mysql.Pool | null = null

export function getDbPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig)
  }
  return pool
}

export async function query(sql: string, params: any[] = []): Promise<any> {
  const pool = getDbPool()
  try {
    const [rows] = await pool.execute(sql, params)
    return rows
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export async function getWarrantyById(id: number): Promise<any> {
  const sql = `
    SELECT 
      w.*,
      c.name as customer_name,
      c.phone as customer_phone,
      c.email as customer_email,
      c.address as customer_address,
      v.plate_number as vehicle_plate,
      v.vin_number as vehicle_vin,
      v.year as vehicle_year,
      v.current_km,
      vm.name as vehicle_model,
      vm.category as vehicle_category
    FROM warranties w
    LEFT JOIN vehicles v ON w.vehicle_id = v.id
    LEFT JOIN customers c ON v.customer_id = c.id
    LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
    WHERE w.id = ?
  `
  
  const rows = await query(sql, [id])
  return rows[0] || null
}

export async function getWarranties(filters: { status?: string; search?: string } = {}): Promise<any[]> {
  let sql = `
    SELECT 
      w.*,
      c.name as customer_name,
      c.phone as customer_phone,
      c.email as customer_email,
      c.address as customer_address,
      v.plate_number as vehicle_plate,
      v.vin_number as vehicle_vin,
      v.year as vehicle_year,
      v.current_km,
      vm.name as vehicle_model,
      vm.category as vehicle_category
    FROM warranties w
    LEFT JOIN vehicles v ON w.vehicle_id = v.id
    LEFT JOIN customers c ON v.customer_id = c.id
    LEFT JOIN vehicle_models vm ON v.vehicle_model_id = vm.id
  `
  
  const conditions: string[] = []
  const params: any[] = []
  
  if (filters.status && filters.status !== 'all') {
    conditions.push('w.status = ?')
    params.push(filters.status)
  }
  
  if (filters.search) {
    conditions.push('(c.name LIKE ? OR v.plate_number LIKE ? OR vm.name LIKE ?)')
    const searchTerm = `%${filters.search}%`
    params.push(searchTerm, searchTerm, searchTerm)
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ')
  }
  
  sql += ' ORDER BY w.created_at DESC'
  
  return await query(sql, params)
}

export async function getWarrantyServices(warrantyId: number): Promise<any[]> {
  const sql = `
    SELECT 
      s.id,
      s.service_date,
      s.total_amount,
      s.service_status,
      s.current_km_at_service,
      s.warranty_used,
      s.cost_covered,
      st.name as service_type_name
    FROM services s
    LEFT JOIN service_types st ON s.service_type_id = st.id
    WHERE s.warranty_id = ?
    ORDER BY s.service_date DESC
  `
  
  return await query(sql, [warrantyId])
}

export async function getWarrantyClaims(warrantyId: number): Promise<any[]> {
  const sql = `
    SELECT 
      wc.id,
      wc.claim_type,
      wc.claim_date,
      wc.description,
      wc.status,
      wc.estimated_cost,
      wc.approved_amount
    FROM warranty_claims wc
    WHERE wc.warranty_id = ?
    ORDER BY wc.claim_date DESC
  `
  
  return await query(sql, [warrantyId])
}






