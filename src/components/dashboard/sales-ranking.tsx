"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export function SalesRanking() {
  return (
    <Card className="border border-gray-800 bg-gray-900/60 overflow-hidden">
      <CardHeader className="bg-gray-900/80 border-b border-gray-800 p-3 flex flex-row items-center justify-between">
        <h3 className="text-base text-gray-100 font-medium flex items-center">
          Ranking de Venta
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
                  #
                </th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">
                  Sucursal
                </th>
                <th className="text-center p-3 text-xs font-medium text-gray-400">
                  Bicicletas
                </th>
                <th className="text-center p-3 text-xs font-medium text-gray-400">
                  Motos - Yadea
                </th>
                <th className="text-center p-3 text-xs font-medium text-gray-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <motion.tr
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-b border-gray-800 bg-gray-800/30"
              >
                <td className="p-3 text-sm text-gray-300">-</td>
                <td className="p-3 text-gray-200 font-medium text-sm">Total</td>
                <td className="p-3 text-center text-gray-200 font-medium text-sm">
                  1
                </td>
                <td className="p-3 text-center text-gray-200 font-medium text-sm">
                  1
                </td>
                <td className="p-3 text-center text-gray-200 font-medium text-sm">
                  2
                </td>
              </motion.tr>
              <motion.tr
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="border-b border-gray-800 hover:bg-gray-800/20 transition-colors"
              >
                <td className="p-3 text-sm text-gray-300">1</td>
                <td className="p-3 text-sm text-gray-300">Q - Cochabamba</td>
                <td className="p-3 text-center text-sm text-gray-300">1</td>
                <td className="p-3 text-center text-sm text-gray-300">1</td>
                <td className="p-3 text-center text-sm text-gray-300">2</td>
              </motion.tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
