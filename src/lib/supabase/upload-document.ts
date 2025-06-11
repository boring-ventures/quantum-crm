import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_DOCUMENTS_BUCKET || "documents";
const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function uploadDocument(
  file: File,
  leadId: string,
  documentType: string = "proforma"
) {
  // Validar archivo antes de subir
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    throw new Error(
      "Tipo de archivo inválido. Por favor, sube un PDF o documento de Office."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "Tamaño de archivo demasiado grande. Por favor, sube un documento menor a 6MB."
    );
  }

  try {
    const supabase = createClientComponentClient();

    // Subir archivo a Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${documentType}_${leadId}_${Date.now()}.${fileExt}`;
    const filePath = `${leadId}/${fileName}`;

    // Subir archivo
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Obtener la URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return {
      url: publicUrl,
      name: file.name,
      type: file.type,
      size: file.size,
      path: filePath,
    };
  } catch (error) {
    console.error("Error subiendo documento:", error);
    throw error;
  }
}
