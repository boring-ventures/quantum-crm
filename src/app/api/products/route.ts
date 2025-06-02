import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const productSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  nameProduct: z.string().min(1, "El nombre del producto es requerido"),
  descriptionProduct: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  businessTypeId: z
    .string()
    .uuid("ID de tipo de negocio inválido")
    .optional()
    .nullable(),
  brandId: z.string().uuid("ID de marca inválido").optional().nullable(),
  modelId: z.string().uuid("ID de modelo inválido").optional().nullable(),
  countryId: z.string().uuid("ID de país inválido").optional().nullable(),
  currency: z.enum(["BOB", "USD", "USDT"]).default("BOB"),
  isActive: z.boolean().default(true),
  images: z
    .array(
      z.object({
        url: z.string(),
        isMain: z.boolean().default(false),
      })
    )
    .default([]),
});

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener filtros
    const { searchParams } = new URL(request.url);
    const businessTypeId = searchParams.get("businessTypeId") || undefined;
    const brandId = searchParams.get("brandId") || undefined;
    const modelId = searchParams.get("modelId") || undefined;
    const countryId = searchParams.get("countryId") || undefined;
    const currency = searchParams.get("currency") || undefined;
    const active = searchParams.get("active");
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit") as string, 10)
      : undefined;

    // Construir condiciones de búsqueda
    const where: any = {};
    if (businessTypeId) where.businessTypeId = businessTypeId;
    if (brandId) where.brandId = brandId;
    if (modelId) where.modelId = modelId;
    if (countryId) where.countryId = countryId;
    if (currency) where.currency = currency;
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    // Si hay paginación, calcular total de páginas
    let pagination = {};
    if (limit) {
      const total = await prisma.product.count({ where });
      const totalPages = Math.ceil(total / limit);
      pagination = {
        totalPages,
        currentPage: page,
        total,
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        businessType: true,
        brand: true,
        model: true,
        country: true,
        images: true,
      },
      orderBy: {
        name: "asc",
      },
      // Solo aplicar skip y take si hay un límite definido
      ...(limit
        ? {
            skip: (page - 1) * limit,
            take: limit,
          }
        : {}),
    });

    return NextResponse.json(
      limit ? { data: products, ...pagination } : products
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error al obtener los productos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener y validar el cuerpo de la solicitud
    const body = await request.json();

    try {
      const validatedData = productSchema.parse(body);

      // Verificar si ya existe un producto con el mismo código
      const existingProduct = await prisma.product.findUnique({
        where: { code: validatedData.code },
      });

      if (existingProduct) {
        return NextResponse.json(
          { error: "Ya existe un producto con este código" },
          { status: 400 }
        );
      }

      // Verificar si ya existe un producto con el mismo nombre
      const existingProductName = await prisma.product.findUnique({
        where: { name: validatedData.name },
      });

      if (existingProductName) {
        return NextResponse.json(
          { error: "Ya existe un producto con este nombre" },
          { status: 400 }
        );
      }

      // Extraer las imágenes de los datos validados
      const { images, ...productData } = validatedData;

      // Crear el producto usando una transacción para gestionar imágenes
      const product = await prisma.$transaction(async (tx: any) => {
        // Crear el producto
        const newProduct = await tx.product.create({
          data: productData,
        });

        // Crear las imágenes si existen
        if (images && images.length > 0) {
          await Promise.all(
            images.map((image) =>
              tx.productImage.create({
                data: {
                  url: image.url,
                  isMain: image.isMain,
                  productId: newProduct.id,
                },
              })
            )
          );
        }

        // Devolver el producto con todas sus relaciones
        return tx.product.findUnique({
          where: { id: newProduct.id },
          include: {
            businessType: true,
            brand: true,
            model: true,
            country: true,
            images: true,
          },
        });
      });

      return NextResponse.json(product, { status: 201 });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Datos inválidos", details: validationError.format() },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error al crear el producto" },
      { status: 500 }
    );
  }
}
