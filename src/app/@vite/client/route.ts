import { NextResponse } from 'next/server'

// Handle Vite client requests to prevent 404 errors
export async function GET() {
  // Return empty response for Vite client requests
  return new NextResponse(null, { status: 204 })
}

export async function POST() {
  // Return empty response for Vite client requests
  return new NextResponse(null, { status: 204 })
}

export async function OPTIONS() {
  // Handle preflight requests
  return new NextResponse(null, { status: 200 })
}