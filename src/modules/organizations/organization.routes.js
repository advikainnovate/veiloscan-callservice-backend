const express = require('express');
const organizationController = require('./organization.controller');
const { apiKeyAuth } = require('../../middlewares');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Routes — No auth required
| API keys are service credentials, not organization management credentials.
| Creating an org and its first API key must be possible before any key exists.
|--------------------------------------------------------------------------
*/

// Create a new organization (bootstrap, no auth)
router.post('/', organizationController.createOrganization);

// Create an API key for an organization (bootstrap, no auth)
router.post('/:id/api-keys', organizationController.createApiKey);

/*
|--------------------------------------------------------------------------
| Authenticated Routes — Require a valid API key belonging to the org
| The API key identifies AND scopes the request to its owning organization.
|--------------------------------------------------------------------------
*/

// Get the authenticated organization's own info + usage counters + keys
router.get('/me', apiKeyAuth, organizationController.getMe);

// Update the authenticated organization
router.put('/me', apiKeyAuth, organizationController.updateOrganization);

// Delete the authenticated organization
router.delete('/me', apiKeyAuth, organizationController.deleteOrganization);

// Get API keys for the authenticated organization
router.get('/me/api-keys', apiKeyAuth, organizationController.getApiKeys);

// Revoke an API key (must belong to the authenticated org)
router.patch('/me/api-keys/:apiKeyId/revoke', apiKeyAuth, organizationController.revokeApiKey);

module.exports = router;
