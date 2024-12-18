// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const role = request.cookies.get('user_role')?.value;

    // Login sayfasındaysa ve cookie'ler varsa role göre yönlendir
    if (request.nextUrl.pathname === '/login' && token && role) {
        switch (role) {
            case 'admin':
                return NextResponse.redirect(new URL('/admin', request.url));
            case 'expert':
                return NextResponse.redirect(new URL('/expert', request.url));
            case 'family':
                return NextResponse.redirect(new URL('/family', request.url));
        }
    }

    // Ana sayfadaysa ve cookie'ler varsa role göre yönlendir
    if (request.nextUrl.pathname === '/' && token && role) {
        switch (role) {
            case 'admin':
                return NextResponse.redirect(new URL('/admin', request.url));
            case 'expert':
                return NextResponse.redirect(new URL('/expert', request.url));
            case 'family':
                return NextResponse.redirect(new URL('/family', request.url));
        }
    }

    // Özel sayfalara erişim kontrolü
    if (request.nextUrl.pathname.startsWith('/admin') || 
        request.nextUrl.pathname.startsWith('/expert') || 
        request.nextUrl.pathname.startsWith('/family')) {
        
        // Token yoksa login'e yönlendir
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Role göre erişim kontrolü
        if (request.nextUrl.pathname.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        if (request.nextUrl.pathname.startsWith('/expert') && role !== 'expert') {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        if (request.nextUrl.pathname.startsWith('/family') && role !== 'family') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/login', '/admin/:path*', '/expert/:path*', '/family/:path*']
};