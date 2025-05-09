import { NextRequest, NextResponse } from "next/server";

// Redirigir todas las solicitudes a la ruta existente
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const redirectUrl = url.origin + "/api/lead-sources";
  const response = await fetch(redirectUrl, {
    method: "GET",
    headers: request.headers,
  });

  return response;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const url = new URL(request.url);
  const redirectUrl = url.origin + "/api/lead-sources";

  const response = await fetch(redirectUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(request.headers),
    },
    body: JSON.stringify(body),
  });

  return response;
}
