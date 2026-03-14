
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Proteger todas as rotas dentro de /admin
  if (pathname.startsWith('/admin')) {
    // Se não houver token ou se o usuário não for ADMIN, redireciona
    if (!token || token.role !== 'ADMIN') {
      const url = new URL('/unauthorized', req.url);
      return NextResponse.redirect(url);
    }
  }

  // Se o usuário for admin ou a rota não for protegida, continua
  return NextResponse.next();
}

// Define as rotas que devem acionar o middleware
export const config = {
  matcher: ['/admin/:path*'],
};
