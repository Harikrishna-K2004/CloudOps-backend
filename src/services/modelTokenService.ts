import { supabase } from "../config/supabase";
import {
  encryptSecret,
  decryptSecret,
} from "./encryption";

export async function saveModelToken(
  userId: string,
  provider: string,
  token: string,
) {
  const encryptedToken = encryptSecret(token);

  const { data, error } = await supabase
    .from("model_api_tokens")
    .upsert(
      {
        user_id: userId,
        provider,
        encrypted_token: encryptedToken,
        is_configured: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,provider",
      },
    )
    .select("id, provider, is_configured")
    .single();

  if (error) {
    throw new Error(
      `Failed to save model token: ${error.message}`,
    );
  }

  return data;
}

export async function getModelToken(
  userId: string,
  provider: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("model_api_tokens")
    .select("encrypted_token")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to get model token: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  return decryptSecret(data.encrypted_token);
}