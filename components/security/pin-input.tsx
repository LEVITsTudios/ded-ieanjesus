"use client";

import React, { useState, useRef, useEffect } from "react";
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
import { Lock, AlertCircle, CheckCircle } from "lucide-react";

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  isLoading?: boolean;
  error?: string | null;
  label?: string;
  description?: string;
}

/**
 * Componente para ingreso de PIN de seguridad
 */
export const PinInput: React.FC<PinInputProps> = ({
  length = 6,
  onComplete,
  isLoading = false,
  error = null,
  label = "Ingresa tu PIN de seguridad",
  description = "Tu PIN debe tener 6 dígitos",
}) => {
  const [pin, setPin] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (index: number, value: string) => {
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, "");

    const newPin = [...pin];
    newPin[index] = numericValue.slice(-1); // Solo tomar último dígito

    setPin(newPin);

    // Auto-focus al siguiente input
    if (numericValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Si está completo, enviar
    if (newPin.every((digit) => digit !== "") && newPin.length === length) {
      const completedPin = newPin.join("");
      onComplete(completedPin);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newPin = [...pin];

      if (pin[index] === "") {
        // Si está vacío, retroceder al anterior
        if (index > 0) {
          newPin[index - 1] = "";
          setPin(newPin);
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        // Si tiene valor, solo limpiar
        newPin[index] = "";
        setPin(newPin);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/[^0-9]/g, "").split("");

    const newPin = [...pin];
    digits.forEach((digit, index) => {
      if (index < length) {
        newPin[index] = digit;
      }
    });

    setPin(newPin);

    if (newPin.every((digit) => digit !== "") && newPin.length === length) {
      onComplete(newPin.join(""));
    }

    // Focus en el último input
    const lastIndex = Math.min(digits.length, length - 1);
    inputRefs.current[lastIndex]?.focus();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">{label}</Label>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 justify-center">
        {pin.map((digit, index) => (
          <Input
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            className="w-12 h-12 text-center text-xl font-semibold text-foreground placeholder:text-gray-300"
          />
        ))}
      </div>
    </div>
  );
};

interface PinSetupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (pin: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Diálogo para configurar PIN de seguridad
 */
export const PinSetupDialog: React.FC<PinSetupDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  isLoading = false,
}) => {
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [firstPin, setFirstPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFirstPinComplete = (pin: string) => {
    setFirstPin(pin);
    setStep("confirm");
    setError(null);
  };

  const handleConfirmPinComplete = async (pin: string) => {
    if (pin !== firstPin) {
      setError("Los PINs no coinciden. Intenta de nuevo.");
      setConfirmPin("");
      return;
    }

    try {
      await onSubmit(pin);
      setSuccess(true);
      setTimeout(() => {
        setStep("create");
        setFirstPin("");
        setConfirmPin("");
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar el PIN"
      );
      setConfirmPin("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Configurar PIN de Seguridad
          </DialogTitle>
          <DialogDescription>
            {step === "create"
              ? "Crea un PIN de 6 dígitos para asegurar tu cuenta"
              : "Confirma tu PIN"}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-foreground">
              ¡PIN configurado exitosamente!
            </p>
          </div>
        ) : (
          <div className="py-4">
            <PinInput
              onComplete={
                step === "create"
                  ? handleFirstPinComplete
                  : handleConfirmPinComplete
              }
              isLoading={isLoading}
              error={error}
              label={
                step === "create"
                  ? "Crea tu PIN"
                  : "Confirma tu PIN"
              }
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface PinVerificationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (pin: string) => Promise<boolean>;
  isLoading?: boolean;
}

/**
 * Diálogo para verificar PIN durante login
 */
export const PinVerificationDialog: React.FC<PinVerificationDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  isLoading = false,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handlePinComplete = async (pin: string) => {
    try {
      const isValid = await onSubmit(pin);
      if (isValid) {
        onOpenChange(false);
      } else {
        setError("PIN incorrecto. Intenta de nuevo.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al verificar el PIN"
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Verificación de Seguridad
          </DialogTitle>
          <DialogDescription>
            Ingresa tu PIN de 6 dígitos para continuar
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <PinInput
            onComplete={handlePinComplete}
            isLoading={isLoading}
            error={error}
            label="Ingresa tu PIN"
            description="Este PIN se configura en tu perfil de seguridad"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
