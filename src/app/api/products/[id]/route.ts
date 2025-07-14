import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const productUpdateSchema = z.object({
  code: z.string().min(1, "El código es requerido").optional(),
  name: z.string().min(1, "El nombre es requerido").optional(),
  nameProduct: z
    .string()
    .min(1, "El nombre del producto es requerido")
    .optional(),
  descriptionProduct: z.string().optional().nullable(),
  price: z.coerce.number().optional().nullable(),
  businessTypeId: z
    .string()
    .uuid("ID de tipo de negocio inválido")
    .optional()
    .nullable(),
  brandId: z.string().uuid("ID de marca inválido").optional().nullable(),
  modelId: z.string().uuid("ID de modelo inválido").optional().nullable(),
  countryId: z.string().uuid("ID de país inválido").optional().nullable(),
  currency: z.enum(["BOB", "USD", "USDT"]).optional(),
  isActive: z.boolean().optional(),
  images: z
    .array(
      z.object({
        id: z.string().optional(),
        url: z.string(),
        isMain: z.boolean().default(false),
      })
    )
    .optional(),
  specifications: z
    .array(
      z.object({
        feature: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  commercialCondition: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  sellerDiscount: z.coerce.number().optional().nullable(),
  managerDiscount: z.coerce.number().optional().nullable(),
  savingsPlan: z
    .object({
      type: z.string().optional().nullable(),
      firstQuota: z.coerce.number().optional().nullable(),
      totalQuotas: z.coerce.number().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        businessType: true,
        brand: true,
        model: true,
        country: true,
        images: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Error al obtener el producto" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Obtener y validar el cuerpo de la solicitud
    const body = await request.json();

    try {
      const validatedData = productUpdateSchema.parse(body);

      // Si se actualiza el código, verificar que no exista otro producto con ese código
      if (validatedData.code && validatedData.code !== existingProduct.code) {
        const productWithSameCode = await prisma.product.findUnique({
          where: { code: validatedData.code },
        });

        if (productWithSameCode && productWithSameCode.id !== id) {
          return NextResponse.json(
            { error: "Ya existe un producto con este código" },
            { status: 400 }
          );
        }
      }

      // Si se actualiza el nombre, verificar que no exista otro producto con ese nombre
      if (validatedData.name && validatedData.name !== existingProduct.name) {
        const productWithSameName = await prisma.product.findUnique({
          where: { name: validatedData.name },
        });

        if (productWithSameName && productWithSameName.id !== id) {
          return NextResponse.json(
            { error: "Ya existe un producto con este nombre" },
            { status: 400 }
          );
        }
      }

      // Extraer imágenes si existen en los datos validados
      const { images, specifications, savingsPlan, ...productData } =
        validatedData;

      // Usar transacción para actualizar el producto y sus imágenes
      const updatedProduct = await prisma.$transaction(async (tx: any) => {
        // Actualizar el producto
        const updated = await tx.product.update({
          where: { id },
          data: {
            ...productData,
            // Guardar campos adicionales como JSON
            specifications:
              specifications && specifications.length > 0
                ? JSON.stringify(specifications)
                : null,
            savingsPlan: savingsPlan ? JSON.stringify(savingsPlan) : null,
          },
        });

        // Actualizar imágenes si se proporcionaron
        if (images && images.length > 0) {
          // Eliminar imágenes existentes
          await tx.productImage.deleteMany({
            where: { productId: id },
          });

          // Crear nuevas imágenes
          await Promise.all(
            images.map((image) =>
              tx.productImage.create({
                data: {
                  url: image.url,
                  isMain: image.isMain,
                  productId: id,
                },
              })
            )
          );
        }

        // Devolver el producto actualizado con sus relaciones
        return tx.product.findUnique({
          where: { id },
          include: {
            businessType: true,
            brand: true,
            model: true,
            country: true,
            images: true,
          },
        });
      });

      return NextResponse.json(updatedProduct);
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
    console.error(
      "Error updating product:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { error: "Error al actualizar el producto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = params;

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Usar transacción para eliminar el producto y sus imágenes
    await prisma.$transaction(async (tx: any) => {
      // Eliminar imágenes asociadas primero
      await tx.productImage.deleteMany({
        where: { productId: id },
      });

      // Luego eliminar el producto
      await tx.product.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      { message: "Producto eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Error al eliminar el producto" },
      { status: 500 }
    );
  }
}
