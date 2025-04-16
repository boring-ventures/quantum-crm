"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export function SalesRanking() {
  return (
    <Card className="border dark:border-gray-800 border-gray-200 dark:bg-gray-900/60 bg-white/90 overflow-hidden">
      <CardHeader className="dark:bg-gray-900/80 bg-gray-50 border-b dark:border-gray-800 border-gray-200 p-3 flex flex-row items-center justify-between">
        <h3 className="text-base font-medium flex items-center">
          Ranking de Venta
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md dark:text-gray-400 text-gray-500 dark:hover:bg-gray-800 hover:bg-gray-200 dark:hover:text-gray-200 hover:text-gray-900 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md dark:text-gray-400 text-gray-500 dark:hover:bg-gray-800 hover:bg-gray-200 dark:hover:text-gray-200 hover:text-gray-900 transition-colors"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="dark:bg-gray-800/50 bg-gray-100/80">
                <th className="text-left p-3 text-xs font-medium dark:text-gray-400 text-gray-500">
                  #
                </th>
                <th className="text-left p-3 text-xs font-medium dark:text-gray-400 text-gray-500">
                  Sucursal
                </th>
                <th className="text-center p-3 text-xs font-medium dark:text-gray-400 text-gray-500">
                  Bicicletas
                </th>
                <th className="text-center p-3 text-xs font-medium dark:text-gray-400 text-gray-500">
                  Motos - Yadea
                </th>
                <th className="text-center p-3 text-xs font-medium dark:text-gray-400 text-gray-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <motion.tr
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-b dark:border-gray-800 border-gray-200 dark:bg-gray-800/30 bg-gray-50/70"
              >
                <td className="p-3 text-sm dark:text-gray-300 text-gray-500">
                  -
                </td>
                <td className="p-3 dark:text-gray-200 text-gray-900 font-medium text-sm">
                  Total
                </td>
                <td className="p-3 text-center dark:text-gray-200 text-gray-900 font-medium text-sm">
                  1
                </td>
                <td className="p-3 text-center dark:text-gray-200 text-gray-900 font-medium text-sm">
                  1
                </td>
                <td className="p-3 text-center dark:text-gray-200 text-gray-900 font-medium text-sm">
                  2
                </td>
              </motion.tr>
              <motion.tr
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="border-b dark:border-gray-800 border-gray-200 dark:hover:bg-gray-800/20 hover:bg-gray-100/50 transition-colors"
              >
                <td className="p-3 text-sm dark:text-gray-300 text-gray-500">
                  1
                </td>
                <td className="p-3 text-sm dark:text-gray-300 text-gray-700">
                  Q - Cochabamba
                </td>
                <td className="p-3 text-center text-sm dark:text-gray-300 text-gray-700">
                  1
                </td>
                <td className="p-3 text-center text-sm dark:text-gray-300 text-gray-700">
                  1
                </td>
                <td className="p-3 text-center text-sm dark:text-gray-300 text-gray-700">
                  2
                </td>
              </motion.tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
