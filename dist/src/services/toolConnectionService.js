"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToolConnection = createToolConnection;
exports.getToolConnection = getToolConnection;
exports.getUserToolConnections = getUserToolConnections;
exports.deleteToolConnection = deleteToolConnection;
exports.validateToolConnectionCredentials = validateToolConnectionCredentials;
const supabase_1 = require("../config/supabase");
const encryption_1 = require("./encryption");
async function createToolConnection(userId, integrationId, credentials, connectionName = "Default", metadata = {}) {
    const encryptedCredentials = (0, encryption_1.encryptSecret)(JSON.stringify(credentials));
    const { data, error } = await supabase_1.supabase
        .from("tool_connections")
        .insert({
        user_id: userId,
        integration_id: integrationId,
        connection_name: connectionName,
        encrypted_credentials: encryptedCredentials,
        metadata,
    })
        .select("id, integration_id, connection_name, metadata, status, created_at, updated_at")
        .single();
    if (error) {
        throw new Error(`Failed to create tool connection: ${error.message}`);
    }
    return data;
}
async function getToolConnection(userId, integrationId) {
    const { data, error } = await supabase_1.supabase
        .from("tool_connections")
        .select(`
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
      `)
        .eq("user_id", userId)
        .eq("integration_id", integrationId)
        .eq("status", "connected")
        .maybeSingle();
    if (error) {
        throw new Error(`Failed to get tool connection: ${error.message}`);
    }
    if (!data) {
        return null;
    }
    const integration = Array.isArray(data.tool_integrations)
        ? data.tool_integrations[0]
        : data.tool_integrations;
    const credentials = JSON.parse((0, encryption_1.decryptSecret)(data.encrypted_credentials));
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
async function getUserToolConnections(userId) {
    const { data, error } = await supabase_1.supabase
        .from("tool_connections")
        .select(`
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
      `)
        .eq("user_id", userId)
        .eq("status", "connected");
    if (error) {
        throw new Error(`Failed to get tool connections: ${error.message}`);
    }
    return (data ?? []).map((connection) => {
        const integration = Array.isArray(connection.tool_integrations)
            ? connection.tool_integrations[0]
            : connection.tool_integrations;
        return {
            id: connection.id,
            integrationId: connection.integration_id,
            providerId: integration?.provider_id ?? null,
            connectionName: connection.connection_name,
            metadata: connection.metadata,
            status: connection.status,
            credentials: JSON.parse((0, encryption_1.decryptSecret)(connection.encrypted_credentials)),
            created_at: connection.created_at,
            updated_at: connection.updated_at,
        };
    });
}
async function deleteToolConnection(userId, integrationId) {
    const { error } = await supabase_1.supabase
        .from("tool_connections")
        .delete()
        .eq("user_id", userId)
        .eq("integration_id", integrationId);
    if (error) {
        throw new Error(`Failed to delete tool connection: ${error.message}`);
    }
}
/**
 * Validate credentials against the integration's
 * connection schema before storing them.
 */
async function validateToolConnectionCredentials(integrationId, credentials) {
    const { data: integration, error } = await supabase_1.supabase
        .from("tool_integrations")
        .select("provider_id, connection_schema, is_enabled")
        .eq("id", integrationId)
        .maybeSingle();
    if (error) {
        throw new Error(`Failed to load tool integration: ${error.message}`);
    }
    if (!integration) {
        throw new Error("Tool integration not found");
    }
    if (!integration.is_enabled) {
        throw new Error("Tool integration is disabled");
    }
    const schema = (integration.connection_schema ??
        {});
    const fields = schema.fields ?? [];
    for (const field of fields) {
        if (!field.required) {
            continue;
        }
        const value = credentials[field.key];
        if (value === undefined ||
            value === null ||
            (typeof value === "string" &&
                value.trim().length === 0)) {
            throw new Error(`${field.label ?? field.key} is required`);
        }
    }
    return integration;
}
