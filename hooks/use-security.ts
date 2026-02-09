import { createClient } from "@/lib/supabase/client";
import { useCallback, useState } from "react";

/**
 * Hook para manejar PIN de seguridad
 */
export const useSecurityPin = () => {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPin = useCallback(
    async (userId: string, pin: string) => {
      setLoading(true);
      setError(null);

      try {
        // Hash del PIN (en producción usar bcrypt en el servidor)
        const pinHash = await hashPin(pin);

        const { data, error: insertError } = await supabase
          .from("security_pins")
          .upsert(
            { user_id: userId, pin_hash: pinHash, is_active: true },
            { onConflict: "user_id" }
          )
          .select();

        if (insertError) throw insertError;
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al crear PIN";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const verifyPin = useCallback(
    async (userId: string, pin: string) => {
      setLoading(true);
      setError(null);

      try {
        // ✅ PASO 1: Obtener token de sesión del cliente Supabase
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !data?.session) {
          console.error('[PIN Verify] No session found:', sessionError);
          setError('Sesión expirada. Por favor inicia sesión nuevamente');
          return { success: false, error: 'No session' };
        }

        const accessToken = data.session.access_token;
        console.log('[PIN Verify] Session token obtained:', accessToken.substring(0, 20) + '...');

        // ✅ PASO 2: Enviar PIN + TOKEN al servidor
        const response = await fetch('/api/security/pin/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`, // ← CRÍTICO: Token en header
          },
          body: JSON.stringify({ pin, userId }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          // Error o PIN incorrecto
          const message = responseData.error || 'PIN incorrecto';
          console.error('[PIN Verify] Error:', { status: response.status, error: message });
          setError(message);
          return { success: false, error: message };
        }

        console.log('[PIN Verify] PIN validated successfully');
        // ✅ PIN VALIDADO: Se estableció cookie httpOnly automáticamente
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al verificar PIN';
        console.error('[PIN Verify] Exception:', message);
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [] // Sin dependencias de supabase
  );

  return { createPin, verifyPin, loading, error };
};

/**
 * Hook para manejar preguntas de seguridad
 */
export const useSecurityQuestions = () => {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuestions = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("security_questions")
        .select("id, question_text")
        .eq("is_active", true);

      if (fetchError) throw fetchError;
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al obtener preguntas";
      setError(message);
      return { success: false, error: message };
    }
  }, [supabase]);

  const saveAnswers = useCallback(
    async (
      userId: string,
      answers: Array<{ question_id: string; answer: string }>
    ) => {
      setLoading(true);
      setError(null);

      try {
        const answersWithHash = await Promise.all(
          answers.map(async (ans) => ({
            user_id: userId,
            question_id: ans.question_id,
            answer_hash: await hashAnswer(ans.answer),
          }))
        );

        const { data, error: insertError } = await supabase
          .from("user_security_answers")
          .upsert(answersWithHash, { onConflict: "user_id,question_id" })
          .select();

        if (insertError) throw insertError;
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al guardar respuestas";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const verifyAnswers = useCallback(
    async (
      userId: string,
      answers: Array<{ question_id: string; answer: string }>
    ) => {
      setLoading(true);
      setError(null);

      try {
        let correctCount = 0;

        for (const ans of answers) {
          const answerHash = await hashAnswer(ans.answer);
          const { data, error: fetchError } = await supabase
            .from("user_security_answers")
            .select("answer_hash")
            .eq("user_id", userId)
            .eq("question_id", ans.question_id)
            .single();

          if (!fetchError && data?.answer_hash === answerHash) {
            correctCount++;
          }
        }

        // Requiere al menos 2 de 3 respuestas correctas
        const isValid = correctCount >= Math.ceil(answers.length * 0.66);
        return { success: isValid, correctCount };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al verificar respuestas";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  return { getQuestions, saveAnswers, verifyAnswers, loading, error };
};

/**
 * Hook para manejar autenticación biométrica
 */
export const useBiometric = () => {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const checkBiometricSupport = useCallback(async () => {
    try {
      const available =
        window.PublicKeyCredential !== undefined &&
        navigator.credentials !== undefined;
      setIsSupported(available);
      return available;
    } catch (err) {
      return false;
    }
  }, []);

  const registerBiometric = useCallback(
    async (userId: string, deviceName: string) => {
      setLoading(true);
      setError(null);

      try {
        if (!window.PublicKeyCredential) {
          throw new Error("Tu navegador no soporta autenticación biométrica");
        }

        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const credentialCreationOptions = {
          challenge,
          rp: {
            name: "Escuela Dominical",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userId,
            displayName: deviceName,
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" as const }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "preferred",
          },
          timeout: 60000,
          attestation: "none" as const,
        };

        const credential = (await navigator.credentials.create(
          credentialCreationOptions as any
        )) as PublicKeyCredential | null;

        if (!credential) {
          throw new Error("Cancelado por el usuario");
        }

        // Guardar en BD
        const { error: insertError } = await supabase
          .from("biometric_devices")
          .insert({
            user_id: userId,
            device_name: deviceName,
            credential_id: credential.id,
            public_key: JSON.stringify(credential.response),
            is_active: true,
          });

        if (insertError) throw insertError;
        return { success: true, credential };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al registrar biometría";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const authenticateWithBiometric = useCallback(
    async (userId: string) => {
      setLoading(true);
      setError(null);

      try {
        if (!window.PublicKeyCredential) {
          throw new Error("Tu navegador no soporta autenticación biométrica");
        }

        // Obtener credenciales registradas
        const { data: devices, error: fetchError } = await supabase
          .from("biometric_devices")
          .select("credential_id, public_key")
          .eq("user_id", userId)
          .eq("is_active", true);

        if (fetchError || !devices || devices.length === 0) {
          throw new Error("No hay dispositivos biométricos registrados");
        }

        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const assertionOptions = {
          challenge,
          timeout: 60000,
          userVerification: "preferred" as const,
          allowCredentials: devices.map((device: any) => ({
            id: new Uint8Array(
              atob(device.credential_id.split(",")[0])
                .split("")
                .map((c) => c.charCodeAt(0))
            ),
            type: "public-key",
          })),
        };

        const assertion = (await navigator.credentials.get(
          assertionOptions as any
        )) as PublicKeyCredential | null;

        if (!assertion) {
          throw new Error("Cancelado por el usuario");
        }

        // Log del intento
        const deviceId = devices[0].id;
        await supabase.from("biometric_attempt_logs").insert({
          user_id: userId,
          device_id: deviceId,
          success: true,
          ip_address: await getClientIp(),
          user_agent: navigator.userAgent,
        });

        return { success: true, assertion };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error en autenticación biométrica";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  return {
    registerBiometric,
    authenticateWithBiometric,
    checkBiometricSupport,
    isSupported,
    loading,
    error,
  };
};

// Funciones auxiliares
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashAnswer(answer: string): Promise<string> {
  const normalized = answer.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getClientIp(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "unknown";
  } catch {
    return "unknown";
  }
}
