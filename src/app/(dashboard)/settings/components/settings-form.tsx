"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/components/ui/use-toast";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { AvatarUpload } from "@/components/settings/avatar-upload";

const settingsFormSchema = z.object({
  firstName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .optional(),
  lastName: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .optional(),
  avatarUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  active: z.boolean().default(true),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function SettingsForm() {
  const { profile, user, refetch } = useCurrentUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      avatarUrl: profile?.avatarUrl || "",
      active: profile?.active ?? true,
    },
  });

  // Update form values when profile changes
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        avatarUrl: profile.avatarUrl || "",
        active: profile.active ?? true,
      });
    }
  }, [profile, form]);

  async function onSubmit(data: SettingsFormValues) {
    if (isSubmitting || !user) return;

    try {
      setIsSubmitting(true);
      setLoadingMessage("Actualizando perfil...");

      // Add a small delay to simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Retry logic for updating profile
      let success = false;
      let retryCount = 0;
      const maxRetries = 3;
      let lastError: Error | null = null;

      while (!success && retryCount < maxRetries) {
        try {
          setLoadingMessage(
            `Actualizando perfil (intento ${retryCount + 1}/${maxRetries})...`
          );

          // Use the main profile endpoint - it will get the user ID from the session
          const response = await fetch(`/api/users/${user.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              firstName: data.firstName,
              lastName: data.lastName,
              avatarUrl: newAvatarUrl || data.avatarUrl,
              active: data.active,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Error al actualizar el perfil");
          }

          // Refresh the user data after successful update
          if (refetch) await refetch();
          success = true;
        } catch (error) {
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          if (error instanceof Error) {
            lastError = error;
          } else {
            lastError = new Error(String(error));
          }
          retryCount++;

          if (retryCount < maxRetries) {
            // Wait before retrying (increasing delay with each retry)
            setLoadingMessage(
              `Reintentando actualización (${retryCount}/${maxRetries})...`
            );
            // Exponential backoff for retries
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * 1.5 ** retryCount)
            );
          }
        }
      }

      if (!success) {
        throw (
          lastError ||
          new Error(
            "Error al actualizar el perfil después de múltiples intentos"
          )
        );
      }

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido actualizada correctamente.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar la configuración. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setLoadingMessage("");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {isSubmitting && (
        <LoadingScreen
          variant="overlay"
          message={loadingMessage || "Procesando..."}
        />
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información personal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile && (
                <AvatarUpload
                  userId={profile.userId}
                  currentAvatarUrl={profile.avatarUrl}
                  onUploadComplete={(url) => setNewAvatarUrl(url)}
                  onUploadError={(error) => {
                    toast({
                      title: "Error",
                      description: error.message,
                      variant: "destructive",
                    });
                  }}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Admin Settings Card */}
          {profile?.role && profile.role.toString() === "SUPERADMIN" && (
            <Card>
              <CardHeader>
                <CardTitle>Información de Rol</CardTitle>
                <CardDescription>
                  Información sobre tu tipo de cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Rol:</span>
                  <span className="text-sm text-muted-foreground">
                    {profile?.role &&
                      profile.role.toString() === "USER" &&
                      "Usuario"}
                    {profile?.role &&
                      profile.role.toString() === "SUPERADMIN" &&
                      "Administrador"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white"></span>
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
