/**
 * Component: Supabase Connection Tester
 * 
 * Proporciona un formulario visual para diagnosticar problemas de conexión
 * a Supabase directamente en la UI
 */

"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface DiagnosticResult {
  envVars: boolean;
  urlFormat: boolean;
  networkReachable: boolean;
  clientCreation: boolean;
  message: string;
}

export const SupabaseConnectionTester: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [detailedLog, setDetailedLog] = useState<string[]>([]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDetailedLog([]);
    const logs: string[] = [];

    try {
      const result: DiagnosticResult = {
        envVars: false,
        urlFormat: false,
        networkReachable: false,
        clientCreation: false,
        message: '',
      };

      // 1. Verificar variables de entorno
      logs.push('🔍 Verificando variables de entorno...');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (url && key) {
        result.envVars = true;
        logs.push(`✓ NEXT_PUBLIC_SUPABASE_URL: ${url}`);
        logs.push(`✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${key.substring(0, 20)}...`);
      } else {
        logs.push(`✗ Falta NEXT_PUBLIC_SUPABASE_URL`);
        logs.push(`✗ Falta NEXT_PUBLIC_SUPABASE_ANON_KEY`);
        result.message =
          'Faltan variables de entorno. Verifica .env.local';
      }

      // 2. Verificar formato de URL
      if (url) {
        logs.push('\n🌐 Validando formato de URL...');
        if (url.startsWith('https://')) {
          result.urlFormat = true;
          logs.push(`✓ URL válida: ${url}`);
        } else {
          logs.push(`✗ URL debe comenzar con https://`);
        }
      }

      // 3. Intentar conexión a Supabase
      if (url && key) {
        logs.push('\n🔌 Intentando conexión a Supabase...');
        try {
          const response = await fetch(`${url}/rest/v1/`, {
            method: 'GET',
            headers: {
              'apikey': key,
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(5000), // 5 segundos timeout
          });

          result.networkReachable = true;
          logs.push(`✓ Conexión exitosa (HTTP ${response.status})`);

          if (response.status === 404) {
            logs.push('ℹ️ 404 es normal - indica que Supabase está accesible');
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          logs.push(
            `✗ Error de conexión: ${errorMsg}`
          );
          logs.push('   Verifica:');
          logs.push('   - Conexión a internet');
          logs.push('   - URL y credenciales de Supabase');
          logs.push('   - Firewall/VPN');
        }
      }

      // 4. Intentar crear el cliente
      logs.push('\n⚙️ Intentando crear cliente Supabase...');
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const client = createClient();

        if (client) {
          result.clientCreation = true;
          logs.push('✓ Cliente creado exitosamente');

          // Intentar obtener la sesión
          try {
            const { data } = await client.auth.getSession();
            if (data.session) {
              logs.push(`✓ Sesión activa: ${data.session.user?.email}`);
            } else {
              logs.push('ℹ️ Sin sesión activa (normal si no estás logueado)');
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            logs.push(`⚠️ Error obteniendo sesión: ${errorMsg}`);
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logs.push(`✗ Error creando cliente: ${errorMsg}`);
      }

      setResults(result);
      setDetailedLog(logs);

      if (
        result.envVars &&
        result.urlFormat &&
        result.networkReachable &&
        result.clientCreation
      ) {
        result.message = '✓ ¡Diagnóstico exitoso! Tu configuración Supabase parece estar correcta.';
      } else if (result.envVars && result.urlFormat && result.networkReachable) {
        result.message =
          '⚠️ Hay un problema al crear el cliente. Por favor recarga la página.';
      } else {
        result.message =
          '❌ Se encontraron problemas de configuración o conectividad.';
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setDetailedLog((prev) => [...prev, `❌ Error inesperado: ${errorMsg}`]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Diagnóstico Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="w-full"
          variant="outline"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Ejecutando diagnóstico...
            </>
          ) : (
            'Ejecutar Diagnóstico'
          )}
        </Button>

        {results && (
          <Alert className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <AlertDescription className="text-sm space-y-2">
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {results.message}
              </div>
              <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  {results.envVars ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span>Variables de entorno</span>
                </div>
                <div className="flex items-center gap-2">
                  {results.urlFormat ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span>Formato de URL</span>
                </div>
                <div className="flex items-center gap-2">
                  {results.networkReachable ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span>Conectividad a Supabase</span>
                </div>
                <div className="flex items-center gap-2">
                  {results.clientCreation ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span>Creación del cliente</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {detailedLog.length > 0 && (
          <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-3 rounded text-xs font-mono space-y-1 max-h-64 overflow-y-auto border border-slate-700">
            {detailedLog.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        )}

        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <AlertDescription className="text-xs text-blue-900 dark:text-blue-100">
            💡 Este diagnóstico verifica la configuración de Supabase. Los
            resultados se muestran en la consola del navegador (F12).
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
