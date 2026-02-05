"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Fingerprint,
  Trash2,
  Plus,
} from "lucide-react";

interface BiometricDevice {
  id: string;
  device_name: string;
  created_at: string;
  last_used_at?: string;
  is_active: boolean;
}

interface BiometricAuthProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticate: () => Promise<boolean>;
  isLoading?: boolean;
}

/**
 * Componente para autenticación biométrica durante login
 */
export const BiometricAuth: React.FC<BiometricAuthProps> = ({
  isOpen,
  onOpenChange,
  onAuthenticate,
  isLoading = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const success = await onAuthenticate();
      if (success) {
        onOpenChange(false);
      } else {
        setError("Autenticación biométrica fallida");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error en autenticación biométrica"
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Autenticación Biométrica
          </DialogTitle>
          <DialogDescription>
            Usa tu huella dactilar o reconocimiento facial para acceder
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-8">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <Fingerprint className="h-12 w-12 text-primary" />
              </div>
              {isAuthenticating && (
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="font-medium text-foreground">
                {isAuthenticating
                  ? "Esperando..."
                  : "Coloca tu dedo o mira la cámara"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAuthenticating
                  ? "Procesando tu datos biométricos..."
                  : "Tu dispositivo detectará automáticamente tu huella o rostro"}
              </p>
            </div>
          </div>

          <Button
            onClick={handleBiometricAuth}
            disabled={isAuthenticating || isLoading}
            className="w-full"
            size="lg"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Autenticando...
              </>
            ) : (
              "Usar Autenticación Biométrica"
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAuthenticating}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface BiometricSetupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (deviceName: string) => Promise<void>;
  devices: BiometricDevice[];
  onDeleteDevice: (deviceId: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Componente para registrar dispositivos biométricos
 */
export const BiometricSetup: React.FC<BiometricSetupProps> = ({
  isOpen,
  onOpenChange,
  onRegister,
  devices,
  onDeleteDevice,
  isLoading = false,
}) => {
  const [deviceName, setDeviceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Verificar soporte de WebAuthn
    const checkSupport = async () => {
      const supported =
        window.PublicKeyCredential !== undefined &&
        (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.());
      setIsSupported(supported);
    };

    checkSupport();
  }, []);

  const handleRegister = async () => {
    if (!deviceName.trim()) {
      setError("Por favor ingresa un nombre para el dispositivo");
      return;
    }

    try {
      await onRegister(deviceName);
      setSuccess(true);
      setDeviceName("");
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al registrar dispositivo biométrico"
      );
    }
  };

  const handleDelete = async (deviceId: string) => {
    setDeletingId(deviceId);
    try {
      await onDeleteDevice(deviceId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al eliminar dispositivo"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Autenticación Biométrica
          </DialogTitle>
          <DialogDescription>
            Registra tus dispositivos biométricos (huella dactilar, rostro) para un acceso más seguro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Dispositivo biométrico registrado exitosamente
              </AlertDescription>
            </Alert>
          )}

          {!isSupported && (
            <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Tu navegador o dispositivo no soporta autenticación biométrica
              </AlertDescription>
            </Alert>
          )}

          {isSupported && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Registrar Nuevo Dispositivo
                </CardTitle>
                <CardDescription>
                  Agrega un nuevo dispositivo biométrico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="device-name">Nombre del Dispositivo</Label>
                  <Input
                    id="device-name"
                    placeholder="Ej: Mi iPhone, Mi laptop"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Dale un nombre descriptivo para identificarlo fácilmente
                  </p>
                </div>

                <Button
                  onClick={handleRegister}
                  disabled={isLoading || !deviceName.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Registrar Dispositivo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {devices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Dispositivos Registrados
                </CardTitle>
                <CardDescription>
                  {devices.length} dispositivo{devices.length !== 1 ? "s" : ""} registrado{devices.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Fingerprint className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{device.device_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Registrado:{" "}
                          {new Date(device.created_at).toLocaleDateString()}
                          {device.last_used_at && (
                            <>
                              {" • Usado: "}
                              {new Date(device.last_used_at).toLocaleDateString()}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(device.id)}
                      disabled={deletingId === device.id || isLoading}
                    >
                      {deletingId === device.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
