import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/auth/login"];
const ADMIN_PATHS = ["/admin"];

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function proxy(req: NextRequest) {
	const { pathname } = req.nextUrl;

	// Skip static & internal routes
	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/api") ||
		pathname === "/favicon.ico" ||
		pathname.endsWith(".png") ||
		pathname.endsWith(".jpg") ||
		pathname.endsWith(".svg")
	) {
		return NextResponse.next();
	}

	const token = req.cookies.get("token")?.value;

	// 2. Handle root path: redirect based on auth status
	if (pathname === "/") {
		if (token) {
			try {
				await jwtVerify(token, JWT_SECRET);
				return NextResponse.redirect(new URL("/admin", req.url));
			} catch {
				// Token tidak valid, redirect ke login
				const response = NextResponse.redirect(new URL("/auth/login", req.url));
				response.cookies.delete("token");
				return response;
			}
		}
		return NextResponse.redirect(new URL("/auth/login", req.url));
	}

	// 3. Jika sudah login tapi malah mau buka halaman login, lempar ke admin
	if (pathname === "/auth/login" && token) {
		try {
			await jwtVerify(token, JWT_SECRET);
			return NextResponse.redirect(new URL("/admin", req.url));
		} catch {
			// Token tidak valid, biarkan akses halaman login
			return NextResponse.next();
		}
	}

	// 4. Cek apakah ini path publik
	if (PUBLIC_PATHS.includes(pathname)) {
		return NextResponse.next();
	}

	// 5. Cek token untuk halaman yang butuh auth
	if (!token) {
		return NextResponse.redirect(new URL("/auth/login", req.url));
	}

	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);

		if (ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
			if (payload.role !== "SUPER_ADMIN") {
				return NextResponse.redirect(new URL("/", req.url));
			}
		}

		return NextResponse.next();
	} catch {
		// Jika token error/expired, hapus cookie dan pindah ke login
		const response = NextResponse.redirect(new URL("/auth/login", req.url));
		response.cookies.delete("token");
		return response;
	}
}

// Konfigurasi matcher
export const config = {
	matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
