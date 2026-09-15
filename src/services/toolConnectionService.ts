import { supabase } from "../config/supabase";
import { decryptSecret, encryptSecret } from "./encryption";

export interface ToolConnectionCredentials {
  [key: string]: unknown;
}

interface ToolConnectionField {
  key: string;
  label?: string;
  type?: string;
  required?: boolean;
  secret?: boolean;
}

interface ToolConnectionSchema {
  fields?: ToolConnectionField[];
}

export async function createToolConnection(
  userId: string,
  integrationId: string,
  credentials: ToolConnectionCredentials,
  connectionName = "Default",
  metadata: Record<string, unknown> = {},
) {
  const encryptedCredentials = encryptSecret(
    JSON.stringify(credentials),
  );

  const { data, error } = await supabase
    .from("tool_connections")
    .insert({
      user_id: userId,
      integration_id: integrationId,
      connection_name: connectionName,
      encrypted_credentials: encryptedCredentials,
      metadata,
    })
    .select(
      "id, integration_id, connection_name, metadata, status, created_at, updated_at",
    )
    .single();

  if (error) {
    throw new Error(
      `Failed to create tool connection: ${error.message}`,
    );
  }

  return data;
}

export async function getToolConnection(
  userId: string,
  integrationId: string,
) {
  const { data, error } = await supabase
    .from("tool_connections")
    .select(
      `
      id,
      integration_id,
      connection_name,
      encrypted_credentials,
      metadata,
      status,
      created_at,
      updated_at,
      tool_integrations (
        provider_id
      )
      `,
    )
    .eq("user_id", userId)
    .eq("integration_id", integrationId)
    .eq("status", "connected")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to get tool connection: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  const integration = Array.isArray(data.tool_integrations)
    ? data.tool_integrations[0]
    : data.tool_integrations;

  const credentials = JSON.parse(
    decryptSecret(data.encrypted_credentials),
  ) as ToolConnectionCredentials;

  return {
    id: data.id,
    integrationId: data.integration_id,
    providerId: integration?.provider_id ?? null,
    connectionName: data.connection_name,
    metadata: data.metadata,
    status: data.status,
    credentials,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function getUserToolConnections(
  userId: string,
) {
  const { data, error } = await supabase
    .from("tool_connections")
    .select(
      `
      id,
      integration_id,
      connection_name,
      encrypted_credentials,
      metadata,
      status,
      created_at,
      updated_at,
      tool_integrations (
        provider_id
      )
      `,
    )
    .eq("user_id", userId)
    .eq("status", "connected");

  if (error) {
    throw new Error(
      `Failed to get tool connections: ${error.message}`,
    );
  }

  return (data ?? []).map((connection) => {
    const integration = Array.isArray(
      connection.tool_integrations,
    )
      ? connection.tool_integrations[0]
      : connection.tool_integrations;

    return {
      id: connection.id,
      integrationId: connection.integration_id,
      providerId: integration?.provider_id ?? null,
      connectionName: connection.connection_name,
      metadata: connection.metadata,
      status: connection.status,
      credentials: JSON.parse(
        decryptSecret(connection.encrypted_credentials),
      ) as ToolConnectionCredentials,
      created_at: connection.created_at,
      updated_at: connection.updated_at,
    };
  });
}

export async function deleteToolConnection(
  userId: string,
  integrationId: string,
) {
  const { error } = await supabase
    .from("tool_connections")
    .delete()
    .eq("user_id", userId)
    .eq("integration_id", integrationId);

  if (error) {
    throw new Error(
      `Failed to delete tool connection: ${error.message}`,
    );
  }
}

/**
 * Validate credentials against the integration's
 * connection schema before storing them.
 */
export async function validateToolConnectionCredentials(
  integrationId: string,
  credentials: ToolConnectionCredentials,
) {
  const { data: integration, error } =
    await supabase
      .from("tool_integrations")
      .select(
        "id, provider_id, connection_schema, is_enabled",
      )
      .eq("id", integrationId)
      .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load tool integration: ${error.message}`,
    );
  }

  if (!integration) {
    throw new Error(
      "Tool integration not found",
    );
  }

  if (!integration.is_enabled) {
    throw new Error(
      "Tool integration is disabled",
    );
  }

  const schema =
    (integration.connection_schema ??
      {}) as ToolConnectionSchema;

  const fields = schema.fields ?? [];

  for (const field of fields) {
    if (!field.required) {
      continue;
    }

    const value = credentials[field.key];

    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" &&
        value.trim().length === 0)
    ) {
      throw new Error(
        `${field.label ?? field.key} is required`,
      );
    }
  }

  return integration;
}