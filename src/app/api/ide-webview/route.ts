import { NextResponse } from 'next/server'

// Handle IDE webview requests to prevent 404 errors
export async function GET() {
  // Return empty response for IDE webview requests
  return new NextResponse(null, { status: 204 })
}

export async function POST() {
  // Return empty response for IDE webview requests
  return new NextResponse(null, { status: 204 })
}

export async function OPTIONS() {
  // Handle preflight requests
  return new NextResponse(null, { status: 200 })
}
