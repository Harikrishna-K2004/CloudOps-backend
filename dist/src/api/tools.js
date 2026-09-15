"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../config/supabase");
const toolConnectionService_1 = require("../services/toolConnectionService");
const router = (0, express_1.Router)();
/**
 * GET /api/tools/integrations
 *
 * Returns every enabled tool integration and the
 * current user's connection status.
 *
 * Credentials are never returned to the frontend.
 */
router.get("/integrations", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        const { data: integrations, error } = await supabase_1.supabase
            .from("tool_integrations")
            .select(`
            id,
            provider_id,
            name,
            description,
            source_type,
            connection_schema,
            is_enabled
            `)
            .eq("is_enabled", true)
            .order("name");
        if (error) {
            throw new Error(error.message);
        }
        const connections = await (0, toolConnectionService_1.getUserToolConnections)(userId);
        const connectionByProvider = new Map(connections
            .filter((connection) => connection.providerId !== null)
            .map((connection) => [
            connection.providerId,
            connection,
        ]));
        const result = (integrations ?? []).map((integration) => {
            const connection = connectionByProvider.get(integration.provider_id);
            return {
                id: integration.id,
                providerId: integration.provider_id,
                name: integration.name,
                description: integration.description ?? "",
                sourceType: integration.source_type,
                connectionSchema: integration.connection_schema ?? {
                    fields: [],
                },
                isEnabled: integration.is_enabled,
                status: connection
                    ? connection.status
                    : "available",
                connection: connection
                    ? {
                        id: connection.id,
                        integrationId: connection.integrationId,
                        providerId: connection.providerId,
                        connectionName: connection.connectionName,
                        status: connection.status,
                        metadata: connection.metadata,
                        createdAt: connection.created_at ??
                            null,
                        updatedAt: connection.updated_at ??
                            null,
                    }
                    : null,
            };
        });
        return res.json({
            integrations: result,
        });
    }
    catch (error) {
        console.error("Failed to get tool integrations:", error);
        return res.status(500).json({
            error: "Failed to get tool integrations",
        });
    }
});
/**
 * GET /api/tools/connections
 *
 * Returns the current user's connected integrations.
 *
 * Credentials are deliberately stripped before
 * returning the response.
 */
router.get("/connections", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        const connections = await (0, toolConnectionService_1.getUserToolConnections)(userId);
        return res.json({
            connections: connections.map((connection) => ({
                id: connection.id,
                integrationId: connection.integrationId,
                providerId: connection.providerId,
                connectionName: connection.connectionName,
                status: connection.status,
                metadata: connection.metadata,
            })),
        });
    }
    catch (error) {
        console.error("Failed to get tool connections:", error);
        return res.status(500).json({
            error: "Failed to get tool connections",
        });
    }
});
/**
 * POST /api/tools/:providerId/connect
 *
 * Creates a connection for an integration.
 *
 * Credentials are validated against the integration
 * schema and then encrypted before being stored.
 */
router.post("/:providerId/connect", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { providerId } = req.params;
        const { credentials, connectionName, } = req.body;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        if (!providerId ||
            typeof providerId !== "string") {
            return res.status(400).json({
                error: "Provider ID is required",
            });
        }
        if (!credentials ||
            typeof credentials !== "object" ||
            Array.isArray(credentials)) {
            return res.status(400).json({
                error: "Credentials are required",
            });
        }
        const { data: integration, error } = await supabase_1.supabase
            .from("tool_integrations")
            .select("id, provider_id")
            .eq("provider_id", providerId)
            .maybeSingle();
        if (error) {
            throw new Error(error.message);
        }
        if (!integration) {
            return res.status(404).json({
                error: "Tool integration not found",
            });
        }
        const validatedIntegration = await (0, toolConnectionService_1.validateToolConnectionCredentials)(integration.id, credentials);
        const result = await (0, toolConnectionService_1.createToolConnection)(userId, validatedIntegration.id, credentials, typeof connectionName === "string" &&
            connectionName.trim()
            ? connectionName.trim()
            : "Default");
        return res.status(201).json({
            connection: {
                id: result.id,
                integrationId: result.integration_id,
                providerId: validatedIntegration.provider_id,
                connectionName: result.connection_name,
                status: result.status,
                metadata: result.metadata,
                createdAt: result.created_at,
                updatedAt: result.updated_at,
            },
        });
    }
    catch (error) {
        console.error("Failed to connect tool:", error);
        return res.status(500).json({
            error: "Failed to connect tool",
        });
    }
});
/**
 * DELETE /api/tools/:providerId/connect
 *
 * Removes the current user's connection.
 */
router.delete("/:providerId/connect", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { providerId } = req.params;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        if (!providerId ||
            typeof providerId !== "string") {
            return res.status(400).json({
                error: "Provider ID is required",
            });
        }
        const { data: integration, error } = await supabase_1.supabase
            .from("tool_integrations")
            .select("id")
            .eq("provider_id", providerId)
            .maybeSingle();
        if (error) {
            throw new Error(error.message);
        }
        if (!integration) {
            return res.status(404).json({
                error: "Tool integration not found",
            });
        }
        await (0, toolConnectionService_1.deleteToolConnection)(userId, integration.id);
        return res.json({
            success: true,
            providerId,
        });
    }
    catch (error) {
        console.error("Failed to disconnect tool:", error);
        return res.status(500).json({
            error: "Failed to disconnect tool",
        });
    }
});
exports.default = router;
