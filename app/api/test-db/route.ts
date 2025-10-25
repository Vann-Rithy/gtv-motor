import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...')
    
    const dbConfig = {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'gtv_motor_php',
      port: 3306,
    }
    
    const connection = await mysql.createConnection(dbConfig)
    console.log('Database connected successfully!')
    
    // Test query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM warranties')
    console.log('Warranties count:', rows)
    
    await connection.end()
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      warranties_count: rows[0].count,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}






