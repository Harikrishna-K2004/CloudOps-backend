import { supabase } from "../config/supabase";
import {
  encryptSecret,
  decryptSecret,
} from "./encryption";

export async function saveToolSecret(
  userId: string,
  toolId: string,
  credentials: string,
) {
  const encryptedCredentials = encryptSecret(credentials);

  const { data, error } = await supabase
    .from("tool_secrets")
    .upsert(
      {
        user_id: userId,
        tool_id: toolId,
        encrypted_credentials: encryptedCredentials,
        is_configured: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,tool_id",
      },
    )
    .select("id, tool_id, is_configured")
    .single();

  if (error) {
    throw new Error(
      `Failed to save tool secret: ${error.message}`,
    );
  }

  return data;
}

export async function getToolSecret(
  userId: string,
  toolId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("tool_secrets")
    .select("encrypted_credentials")
    .eq("user_id", userId)
    .eq("tool_id", toolId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to get tool secret: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  return decryptSecret(data.encrypted_credentials);
}