import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, CheckCircle2, Clock } from "lucide-react";

export function PendingTasks() {
  const tasks = [
    {
      id: 1,
      title: "Llamada de seguimiento",
      lead: "Carlos Mendoza",
      leadAvatar: "/placeholder.svg",
      time: "15:00",
      priority: "high",
    },
    {
      id: 2,
      title: "Enviar cotización",
      lead: "María Antonia López",
      leadAvatar: "/placeholder.svg",
      time: "Mañana, 10:00",
      priority: "medium",
    },
    {
      id: 3,
      title: "Actualizar datos",
      lead: "Nicolas Rojas",
      leadAvatar: "/placeholder.svg",
      time: "Mañana, 14:30",
      priority: "low",
    },
  ];

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
              <AvatarImage src={task.leadAvatar} />
              <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                {task.lead.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                {task.title}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {task.lead}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {task.time}
                </span>
                <Badge
                  variant="secondary"
                  className={
                    task.priority === "high"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : task.priority === "medium"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  }
                >
                  {task.priority === "high"
                    ? "Alta"
                    : task.priority === "medium"
                      ? "Media"
                      : "Baja"}
                </Badge>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-gray-400 hover:text-green-600 dark:hover:text-green-500"
            >
              <CheckCircle2 className="h-5 w-5" />
            </Button>
          </div>
        </Card>
      ))}

      <div className="pt-4">
        <Button
          variant="outline"
          className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Ver todas las tareas
        </Button>
      </div>
    </div>
  );
}
