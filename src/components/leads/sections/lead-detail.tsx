// // "use client";

// import { useState } from "react";
// import { format } from "date-fns";
// import { es } from "date-fns/locale";
// import {
//   Edit,
//   Mail,
//   Phone,
//   Star,
//   CalendarClock,
//   MoreHorizontal,
// } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// import { LeadWithRelations } from "@/types/lead";
// import { useUpdateLeadStatusMutation } from "@/lib/hooks/use-leads";

// // Importamos las secciones correspondientes
// import { LeadInfo } from "@/components/leads/sections/lead-info";
// import { LeadTasks } from "@/components/leads/sections/lead-tasks";
// import { LeadTimeline } from "@/components/leads/sections/lead-timeline";
// import { LeadDocuments } from "@/components/leads/sections/lead-documents";

// interface LeadDetailProps {
//   lead: LeadWithRelations;
// }

// export function LeadDetail({ lead }: LeadDetailProps) {
//   const [activeTab, setActiveTab] = useState("informacion");
//   const updateStatusMutation = useUpdateLeadStatusMutation();

//   function getInitials(firstName: string, lastName: string): string {
//     return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
//   }

//   function toggleFavorite() {
//     // Implementar lógica para marcar/desmarcar favorito
//     console.log("Toggling favorite status");
//   }

//   return (
//     <div className="flex gap-6">
//       <div className="flex-1 space-y-4">
//         {/* Cabecera del Lead */}
//         <div className="bg-white rounded-md shadow-sm p-4 flex items-center gap-3">
//           <Avatar className="h-12 w-12">
//             <AvatarFallback className="bg-gray-100 text-gray-600">
//               {getInitials(lead.firstName, lead.lastName)}
//             </AvatarFallback>
//           </Avatar>

//           <div className="flex-1">
//             <div className="flex items-center gap-2">
//               <h1 className="text-lg font-medium">
//                 {lead.firstName} {lead.lastName}
//               </h1>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="text-amber-500 h-6 w-6"
//                 onClick={toggleFavorite}
//               >
//                 <Star className="h-4 w-4" />
//               </Button>
//             </div>
//             <p className="text-sm text-gray-500">
//               {lead.source?.name || "Facebook"}
//             </p>
//           </div>

//           <div className="flex items-center gap-2">
//             <Button variant="outline" size="sm" className="h-8">
//               <Mail className="h-4 w-4 mr-1" />
//               <span>Email</span>
//             </Button>

//             <Button variant="outline" size="sm" className="h-8">
//               <Phone className="h-4 w-4 mr-1" />
//               <span>SMS</span>
//             </Button>

//             <Button variant="outline" size="sm" className="h-8">
//               <CalendarClock className="h-4 w-4 mr-1" />
//               <span>Asistencia</span>
//             </Button>
//           </div>
//         </div>

//         <div className="flex justify-between items-center px-2">
//           <div className="flex items-center gap-3">
//             <Badge
//               variant="outline"
//               className="bg-gray-50 border-gray-200 text-gray-700 font-normal"
//             >
//               Pendiente de calificación
//             </Badge>
//             <div className="text-sm text-gray-600">
//               Asignado a:{" "}
//               <span className="font-medium">
//                 {lead.assignedTo?.name || "Admin Quantum"}
//               </span>
//             </div>
//           </div>

//           <div className="text-sm text-gray-600">
//             Interés:
//             <Badge variant="outline" className="ml-2 font-normal">
//               Por determinar
//             </Badge>
//           </div>
//         </div>

//         {/* Sistema de pestañas */}
//         <div className="bg-white rounded-md shadow-sm">
//           <Tabs value={activeTab} onValueChange={setActiveTab}>
//             <TabsList className="w-full h-auto px-6 justify-start bg-white border-b">
//               <TabsTrigger
//                 value="informacion"
//                 className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-2.5 text-gray-600"
//               >
//                 Información
//               </TabsTrigger>
//               <TabsTrigger
//                 value="tareas"
//                 className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-2.5 text-gray-600"
//               >
//                 Tareas
//               </TabsTrigger>
//               <TabsTrigger
//                 value="lineaTiempo"
//                 className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-2.5 text-gray-600"
//               >
//                 Línea de tiempo
//               </TabsTrigger>
//               <TabsTrigger
//                 value="documentos"
//                 className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-2.5 text-gray-600"
//               >
//                 Documentos
//               </TabsTrigger>
//             </TabsList>

//             <TabsContent value="informacion" className="p-6">
//               <LeadInfo lead={lead} />
//             </TabsContent>

//             <TabsContent value="tareas" className="p-6">
//               <LeadTasks lead={lead} />
//             </TabsContent>

//             <TabsContent value="lineaTiempo" className="p-6">
//               <LeadTimeline lead={lead} />
//             </TabsContent>

//             <TabsContent value="documentos" className="p-6">
//               <LeadDocuments lead={lead} />
//             </TabsContent>
//           </Tabs>
//         </div>
//       </div>

//       {/* Panel lateral */}
//       <div className="w-64 space-y-3 self-start sticky top-20">
//         <Card className="shadow-sm bg-white overflow-hidden">
//           <CardContent className="p-0">
//             <div className="p-4">
//               <h3 className="font-medium mb-5">Proceso de venta</h3>
//               <div className="space-y-0">
//                 <div className="flex items-center gap-3 mb-2">
//                   <div className="rounded-full bg-primary text-white w-7 h-7 flex items-center justify-center text-sm">
//                     1
//                   </div>
//                   <span className="font-medium text-gray-800">
//                     Crear cotización
//                   </span>
//                 </div>

//                 <div className="border-l-2 border-gray-200 h-5 ml-3.5"></div>

//                 <div className="flex items-center gap-3 mb-2">
//                   <div className="rounded-full bg-gray-200 text-gray-500 w-7 h-7 flex items-center justify-center text-sm">
//                     2
//                   </div>
//                   <span className="text-gray-400">Registrar reserva</span>
//                 </div>

//                 <div className="border-l-2 border-gray-200 h-5 ml-3.5"></div>

//                 <div className="flex items-center gap-3">
//                   <div className="rounded-full bg-gray-200 text-gray-500 w-7 h-7 flex items-center justify-center text-sm">
//                     3
//                   </div>
//                   <span className="text-gray-400">Registrar venta</span>
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="shadow-sm bg-white overflow-hidden">
//           <CardContent className="p-0">
//             <Button
//               className="w-full justify-start rounded-none py-3 h-auto font-normal text-base border-b"
//               variant="ghost"
//             >
//               <Phone className="mr-3 h-5 w-5" />
//               Llamar
//             </Button>

//             <Button
//               className="w-full justify-start rounded-none py-3 h-auto font-normal text-base border-b"
//               variant="ghost"
//             >
//               <CalendarClock className="mr-3 h-5 w-5" />
//               Agendar cita
//             </Button>

//             <Button
//               className="w-full justify-start rounded-none py-3 h-auto font-normal text-base border-b text-amber-500"
//               variant="ghost"
//             >
//               <Star className="mr-3 h-5 w-5" />
//               Quitar de favoritos
//             </Button>

//             <Button
//               className="w-full justify-start rounded-none py-3 h-auto font-normal text-base"
//               variant="ghost"
//             >
//               <MoreHorizontal className="mr-3 h-5 w-5" />
//               Más acciones
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }
