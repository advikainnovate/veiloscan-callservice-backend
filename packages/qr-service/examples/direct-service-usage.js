// Example: Direct Service Usage (without Express)

const {
  QRService,
  SequelizeQRAdapter,
  QRNotFoundException,
  QRValidationException,
} = require('@your-org/qr-service');
const db = require('./database/models');

const qrService = new QRService(new SequelizeQRAdapter(db));

/**
 * Example 1: Setup user account with QR codes
 */
async function setupUserAccount(userId, userEmail) {
  try {
    // Create a new QR code for the user
    const createResult = await qrService.createQRCode();
    const qrCode = createResult.data;

    // Assign it to the user
    const assignResult = await qrService.assignQRCode(qrCode.id, userId);
    console.log(`QR code ${qrCode.humanToken} assigned to user ${userId}`);

    // Send to user's email
    // await emailService.sendQRCode(userEmail, qrCode);

    return assignResult.data;
  } catch (error) {
    console.error('Failed to setup user QR code:', error.message);
    throw error;
  }
}

/**
 * Example 2: Generate QR code batch for printing
 */
async function generatePrintingBatch(quantity, printJobRef) {
  try {
    if (!quantity || quantity < 10) {
      throw new Error('Quantity must be at least 10');
    }

    const result = await qrService.createQRCodeBatch({
      count: quantity,
      purpose: 'printing',
      printJobRef,
      notes: `Print job ${printJobRef}`,
      createdBy: 'system', // or get from context
    });

    const { batch, qrCodes } = result.data;

    console.log(`Created batch: ${batch.batchNumber}`);
    console.log(`Generated ${qrCodes.length} QR codes`);

    // Export for printing
    // const printData = qrCodes.map(q => ({ token: q.token, humanToken: q.humanToken }));
    // await printService.submitBatch(printData, printJobRef);

    return batch;
  } catch (error) {
    if (error instanceof QRValidationException) {
      console.error('Invalid configuration:', error.details);
    } else {
      console.error('Failed to create batch:', error.message);
    }
    throw error;
  }
}

/**
 * Example 3: Resolve QR code when scanned
 */
async function handleQRScan(scannedToken) {
  try {
    // Extract token from scanned data
    const tokenService = new (require('@your-org/qr-service').QRTokenService)();
    const extractedToken = tokenService.extractQRCodeToken(scannedToken);

    if (!extractedToken) {
      throw new Error('Invalid QR code format');
    }

    // Scan the code
    const result = await qrService.scanQRCode(extractedToken);
    const qrCode = result.data;

    if (!qrCode) {
      console.error('QR code not found');
      return null;
    }

    // Get user info if assigned
    if (qrCode.assignedUserId) {
      // const user = await getUserById(qrCode.assignedUserId);
      // return { user, qrCode };
      return { userId: qrCode.assignedUserId, qrCode };
    }

    return { qrCode };
  } catch (error) {
    if (error instanceof QRNotFoundException) {
      console.warn('QR code not found:', scannedToken);
    } else {
      console.error('Failed to scan QR:', error.message);
    }
    throw error;
  }
}

/**
 * Example 4: List user's QR codes
 */
async function getUserQRCodesList(userId) {
  try {
    const result = await qrService.getUserQRCodes(userId);
    const codes = result.data;

    console.log(`User ${userId} has ${codes.length} QR codes`);

    // Group by status
    const byStatus = codes.reduce((acc, code) => {
      acc[code.status] = (acc[code.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Status breakdown:', byStatus);

    return codes;
  } catch (error) {
    console.error('Failed to get user codes:', error.message);
    throw error;
  }
}

/**
 * Example 5: Get available QR codes for assignment
 */
async function getAvailableQRCodesForAssignment(limit = 100) {
  try {
    const result = await qrService.getUnassignedQRCodes(limit);
    const { qrCodes, hasMore, cursor } = result.data;

    console.log(`Found ${qrCodes.length} unassigned QR codes`);
    if (hasMore) {
      console.log('More codes available, cursor for next page:', cursor);
    }

    return { qrCodes, hasMore, cursor };
  } catch (error) {
    console.error('Failed to get unassigned codes:', error.message);
    throw error;
  }
}

/**
 * Example 6: Disable user's QR code
 */
async function disableUserQRCode(qrCodeId, adminUserId) {
  try {
    const result = await qrService.disableQRCode(qrCodeId, adminUserId);
    console.log(`QR code ${qrCodeId} disabled`);

    return result.data;
  } catch (error) {
    if (error instanceof QRNotFoundException) {
      console.error('QR code not found');
    } else {
      console.error('Failed to disable QR code:', error.message);
    }
    throw error;
  }
}

/**
 * Example 7: Bulk operations
 */
async function bulkAssignQRCodes(userQRMap) {
  // userQRMap: { userId: qrCodeId, ... }
  const results = [];

  for (const [userId, qrCodeId] of Object.entries(userQRMap)) {
    try {
      const result = await qrService.assignQRCode(qrCodeId, userId);
      results.push({ userId, success: true, data: result.data });
      console.log(`✓ Assigned QR to user ${userId}`);
    } catch (error) {
      results.push({ userId, success: false, error: error.message });
      console.error(`✗ Failed to assign QR to user ${userId}: ${error.message}`);
    }
  }

  return results;
}

// Export examples
module.exports = {
  setupUserAccount,
  generatePrintingBatch,
  handleQRScan,
  getUserQRCodesList,
  getAvailableQRCodesForAssignment,
  disableUserQRCode,
  bulkAssignQRCodes,
};
