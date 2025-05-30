"use client";

import React, { JSX } from "react";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Save, Copy, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Tipos para el sistema de permisos
export type ScopeValue = "all" | "team" | "self" | false;

export interface PermissionItem {
  view?: ScopeValue;
  create?: ScopeValue;
  edit?: ScopeValue;
  delete?: ScopeValue;
  [key: string]: ScopeValue | undefined;
}

export interface PermissionMap {
  [sectionKey: string]: PermissionItem;
}

interface Section {
  id: string;
  key: string;
  name: string;
  parentKey?: string | null;
  displayOrder: number;
  isActive: boolean;
  url?: string;
}

interface PermissionEditorProps {
  permissions: any;
  onChange: (updatedPermissions: PermissionMap) => void;
  onExportJson?: () => void;
}

export default function PermissionEditor({
  permissions: initialPermissions,
  onChange,
  onExportJson,
}: PermissionEditorProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<PermissionMap>({});

  // Cargar secciones del dashboard
  useEffect(() => {
    async function fetchSections() {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard-sections");
        if (!response.ok) throw new Error("Error al cargar secciones");

        const data = await response.json();
        if (data.success) {
          console.log("data.data: ", data.data);
          setSections(
            data.data.filter((section: Section) => section.isActive) || []
          );
        }
      } catch (error) {
        console.error("Error al cargar secciones:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSections();
  }, []);

  // Normalizar los permisos iniciales al formato correcto
  useEffect(() => {
    function normalizePermissions(perms: any): PermissionMap {
      try {
        const normalized: PermissionMap = {};
        if (!perms) return normalized;

        // Si es una cadena JSON, convertirla a objeto
        const permObj = typeof perms === "string" ? JSON.parse(perms) : perms;

        // Recorrer las claves directas (leads, sales, etc.)
        Object.keys(permObj).forEach((key) => {
          if (typeof permObj[key] === "object" && permObj[key] !== null) {
            // Normaliza cada acción
            const item = { ...permObj[key] };
            ["view", "create", "edit", "delete"].forEach((action) => {
              if (item[action] === true) item[action] = "all";
              if (item[action] === false) item[action] = false;
            });
            normalized[key] = item;
          }
        });

        // Aplanar estructura para secciones anidadas como admin.roles
        function flattenNestedSections(obj: any, prefix = "") {
          if (!obj || typeof obj !== "object") return;

          Object.keys(obj).forEach((key) => {
            const path = prefix ? `${prefix}.${key}` : key;
            const value = obj[key];

            if (value && typeof value === "object") {
              // Si tiene subclaves como "view", "edit", etc., es un permiso
              if (
                "view" in value ||
                "edit" in value ||
                "create" in value ||
                "delete" in value
              ) {
                // Normaliza cada acción
                const item = { ...value };
                ["view", "create", "edit", "delete"].forEach((action) => {
                  if (item[action] === true) item[action] = "all";
                  if (item[action] === false) item[action] = false;
                });
                normalized[path] = item;
              } else {
                // Si no, es una sección anidada
                flattenNestedSections(value, path);
              }
            }
          });
        }

        // Si hay una propiedad "sections" antigua, procesarla
        if (permObj.sections) {
          flattenNestedSections(permObj.sections);
        }

        return normalized;
      } catch (e) {
        console.error("Error normalizing permissions:", e);
        return {};
      }
    }

    const normalizedPermissions = normalizePermissions(initialPermissions);
    setPermissions(normalizedPermissions);
  }, [initialPermissions]);

  // Actualizar un permiso específico
  const updatePermission = (
    sectionKey: string,
    action: string,
    value: ScopeValue
  ) => {
    setPermissions((prev) => {
      const updated = { ...prev };

      // Si la sección no existe, crearla
      if (!updated[sectionKey]) {
        updated[sectionKey] = {};
      }

      // Actualizar la acción específica
      updated[sectionKey] = {
        ...updated[sectionKey],
        [action]: value,
      };

      // Notificar al componente padre
      onChange(updated);

      return updated;
    });
  };

  // Obtener color según el scope
  const getScopeColor = (scope: ScopeValue) => {
    if (scope === "all") return "bg-green-500 hover:bg-green-600 text-white";
    if (scope === "team") return "bg-blue-500 hover:bg-blue-600 text-white";
    if (scope === "self") return "bg-yellow-500 hover:bg-yellow-600 text-white";
    return "bg-gray-500 hover:bg-gray-600 text-white";
  };

  // Resetear permisos a valores predeterminados
  const resetPermissions = () => {
    setPermissions({});
    onChange({});
  };

  // Obtener etiqueta legible del scope
  const getScopeLabel = (scope: ScopeValue): string => {
    switch (scope) {
      case "all":
        return "Todos";
      case "team":
        return "Equipo";
      case "self":
        return "Propio";
      default:
        return "No";
    }
  };

  // Renderizado de la tabla de permisos
  const renderPermissionsTable = () => {
    const standardActions = ["view", "create", "edit", "delete"];

    // Construir mapa de hijos por parentKey
    const childrenMap: { [parentKey: string]: Section[] } = {};
    sections.forEach((section) => {
      if (section.parentKey) {
        if (!childrenMap[section.parentKey])
          childrenMap[section.parentKey] = [];
        childrenMap[section.parentKey].push(section);
      }
    });

    // Renderizar un badge para mostrar el scope
    const renderScopeBadge = (scope: ScopeValue) => (
      <Badge variant="secondary" className={cn(getScopeColor(scope))}>
        {getScopeLabel(scope)}
      </Badge>
    );

    // Renderizar selector para un scope
    const renderScopeSelector = (
      sectionKey: string,
      action: string,
      currentValue: ScopeValue = false
    ) => {
      const stringValue = String(currentValue);
      return (
        <Select
          value={stringValue}
          onValueChange={(value) =>
            updatePermission(
              sectionKey,
              action,
              value === "false" ? false : (value as ScopeValue)
            )
          }
        >
          <SelectTrigger className="w-[100px] h-9 flex justify-between items-center">
            {renderScopeBadge(currentValue)}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center">
                <Badge className={cn("mr-2", getScopeColor("all"))}>
                  Todos
                </Badge>
              </div>
            </SelectItem>
            <SelectItem value="team">
              <div className="flex items-center">
                <Badge className={cn("mr-2", getScopeColor("team"))}>
                  Equipo
                </Badge>
              </div>
            </SelectItem>
            <SelectItem value="self">
              <div className="flex items-center">
                <Badge className={cn("mr-2", getScopeColor("self"))}>
                  Propio
                </Badge>
              </div>
            </SelectItem>
            <SelectItem value="false">
              <div className="flex items-center">
                <Badge className={cn("mr-2", getScopeColor(false))}>No</Badge>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      );
    };

    // Renderizar una fila de sección
    const renderSectionRow = (section: Section) => {
      const sectionPermissions = permissions[section.key] || {};
      return (
        <TableRow key={section.id}>
          <TableCell
            className={cn(
              "font-medium",
              childrenMap[section.key]?.length
                ? "font-semibold bg-muted/20"
                : ""
            )}
          >
            {section.name}
          </TableCell>
          {standardActions.map((action) => (
            <TableCell key={`${section.key}-${action}`} className="text-center">
              {renderScopeSelector(
                section.key,
                action,
                sectionPermissions[action]
              )}
            </TableCell>
          ))}
        </TableRow>
      );
    };

    // Renderizado recursivo
    const renderSectionRecursive = (parentKey: string | null) => {
      return (childrenMap[parentKey || ""] || [])
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .flatMap((section) => {
          // Si la sección no tiene url, no se muestra como fila de permisos, pero sí sus hijos
          const rows: JSX.Element[] = [];
          if (section.url) rows.push(renderSectionRow(section));
          // Renderizar hijos recursivamente
          rows.push(...renderSectionRecursive(section.key));
          return rows;
        });
    };

    // Secciones raíz: parentKey null o undefined
    const rootSections = sections.filter((s) => !s.parentKey);

    return (
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-[200px]">Sección</TableHead>
            <TableHead className="text-center">Ver</TableHead>
            <TableHead className="text-center">Crear</TableHead>
            <TableHead className="text-center">Editar</TableHead>
            <TableHead className="text-center">Eliminar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rootSections
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .flatMap((section) => [
              section.url ? renderSectionRow(section) : null,
              ...renderSectionRecursive(section.key),
            ])
            .filter((x): x is JSX.Element => Boolean(x))}
        </TableBody>
      </Table>
    );
  };

  if (loading) {
    return <div className="py-4 text-center">Cargando secciones...</div>;
  }

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="flex justify-between mb-4">
        <Button variant="outline" onClick={resetPermissions} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Restablecer
        </Button>
        {onExportJson && (
          <Button variant="outline" onClick={onExportJson} size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-[400px] md:h-[40vh]">
          {renderPermissionsTable()}
        </ScrollArea>
      </div>
    </div>
  );
}
