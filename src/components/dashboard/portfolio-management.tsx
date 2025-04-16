"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export function PortfolioManagement() {
  return (
    <Card className="border border-gray-800 bg-gray-900/60 overflow-hidden">
      <CardHeader className="bg-gray-900/80 border-b border-gray-800 p-3 flex flex-row items-center justify-between">
        <h3 className="text-base text-gray-100 font-medium flex items-center">
          Tu Gestión de Cartera
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="text-left p-3 text-xs font-medium text-gray-400">
                  Estado
                </th>
                <th className="text-right p-3 text-xs font-medium text-gray-400">
                  Monto
                </th>
                <th className="text-right p-3 text-xs font-medium text-gray-400">
                  %/T
                </th>
              </tr>
            </thead>
            <tbody>
              <motion.tr
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-b border-gray-800 bg-gray-800/30"
              >
                <td className="p-3 text-gray-200 font-medium text-sm">Total</td>
                <td className="p-3 text-right text-gray-200 font-medium text-sm">
                  2099
                </td>
                <td className="p-3 text-right text-gray-200 font-medium text-sm">
                  100%
                </td>
              </motion.tr>
              <motion.tr
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="border-b border-gray-800 hover:bg-gray-800/20 transition-colors"
              >
                <td className="p-3 flex items-center text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  <span className="text-gray-300">Activa</span>
                </td>
                <td className="p-3 text-right text-gray-300 text-sm">808</td>
                <td className="p-3 text-right text-gray-300 text-sm">38.49</td>
              </motion.tr>
              <motion.tr
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border-b border-gray-800 hover:bg-gray-800/20 transition-colors"
              >
                <td className="p-3 flex items-center text-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  <span className="text-gray-300">Trabajando</span>
                </td>
                <td className="p-3 text-right text-gray-300 text-sm">476</td>
                <td className="p-3 text-right text-gray-300 text-sm">22.68</td>
              </motion.tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
