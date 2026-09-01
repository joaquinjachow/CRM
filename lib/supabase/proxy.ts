import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const publicPaths = new Set(['/login', '/registrarse', '/olvidar-contrasena', '/actualizar-contrasena'])

function copyAuthResponse(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => to.cookies.set(name, value, options))
  const responseHeaders = ['cache-control', 'expires', 'pragma']
  responseHeaders.forEach((name) => {
    const value = from.headers.get(name)
    if (value) to.headers.set(name, value)
  })
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          Object.entries(headers).forEach(([key, value]) => supabaseResponse.headers.set(key, value))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const isPublicPath = publicPaths.has(pathname) || pathname.startsWith('/auth/')

  if (!user && !isPublicPath) {
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
      copyAuthResponse(supabaseResponse, response)
      return response
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    const response = NextResponse.redirect(loginUrl)
    copyAuthResponse(supabaseResponse, response)
    return response
  }

  return supabaseResponse
}