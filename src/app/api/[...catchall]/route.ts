import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Catch-all route to handle IDE and development tool requests
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  
  // Handle IDE webview requests
  if (url.searchParams.has('ide_webview_request_time')) {
    return new NextResponse(null, { status: 204 })
  }
  
  // Handle Vite client requests
  if (url.pathname.includes('@vite')) {
    return new NextResponse(null, { status: 204 })
  }
  
  // For other unmatched API routes, return 404
  return new NextResponse('Not Found', { status: 404 })
}

export async function POST(request: NextRequest) {
  return GET(request)
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 })
}