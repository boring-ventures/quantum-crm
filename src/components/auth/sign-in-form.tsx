"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({
    message: "Por favor, ingresa un email válido.",
  }),
  password: z.string().min(8, {
    message: "La contraseña debe tener al menos 8 caracteres.",
  }),
});

export function SignInForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const supabase = createClientComponentClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAuthError("");

    try {
      // Iniciar sesión con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error;
      }

      console.log("data", data);

      // Verificar que el usuario existe en la tabla users y tiene un rol válido
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, roleId, isActive")
        .eq("id", data.user.id)
        .single();

      if (userError) {
        throw new Error("No se encontró tu cuenta de usuario o no está activa");
      }

      if (!userData.roleId) {
        throw new Error(
          "Tu cuenta no tiene un rol asignado. Contacta al administrador"
        );
      }

      if (!userData.isActive) {
        throw new Error(
          "Tu cuenta está desactivada. Contacta al administrador"
        );
      }

      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al sistema",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      console.error("Error de inicio de sesión:", error);

      // Mensajes de error amigables
      if (error.message.includes("Invalid login credentials")) {
        setAuthError("Email o contraseña incorrectos");
      } else if (error.message.includes("Too many requests")) {
        setAuthError("Demasiados intentos fallidos. Intenta más tarde");
      } else {
        setAuthError(error.message || "Error al iniciar sesión");
      }

      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: "No se pudo iniciar sesión. Verifica tus credenciales.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Iniciar sesión</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Ingresa tus credenciales para acceder al sistema
        </p>
      </div>

      {authError && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {authError}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ejemplo@correo.com"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar sesión SignInForm
          </Button>
        </form>
      </Form>
    </div>
  );
}
