import { NextRequest } from "next/server";

// Redirigir todas las solicitudes a la ruta existente
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const url = new URL(request.url);
  const redirectUrl = `${url.origin}/api/source-categories/${id}`;

  const response = await fetch(redirectUrl, {
    method: "GET",
    headers: request.headers,
  });

  return response;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();
  const url = new URL(request.url);
  const redirectUrl = `${url.origin}/api/source-categories/${id}`;

  const response = await fetch(redirectUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(request.headers),
    },
    body: JSON.stringify(body),
  });

  return response;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const url = new URL(request.url);
  const redirectUrl = `${url.origin}/api/source-categories/${id}`;

  const response = await fetch(redirectUrl, {
    method: "DELETE",
    headers: request.headers,
  });

  return response;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();
  const url = new URL(request.url);
  const redirectUrl = `${url.origin}/api/source-categories/${id}`;

  const response = await fetch(redirectUrl, {
    method: "PUT", // Usamos PUT para actualizar, ya que el endpoint original usa PUT
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(request.headers),
    },
    body: JSON.stringify(body),
  });

  return response;
}
