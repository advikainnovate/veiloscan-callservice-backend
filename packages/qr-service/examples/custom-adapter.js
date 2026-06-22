// Example: Custom Database Adapter for MongoDB

const { IQRDatabaseAdapter } = require('@your-org/qr-service');

/**
 * MongoDB Adapter Implementation
 * Shows how to adapt the service to different databases
 */
class MongoDBQRAdapter extends IQRDatabaseAdapter {
    constructor(mongoDb) {
        super();
        this.db = mongoDb;
        this.qrCodesCollection = mongoDb.collection('qr_codes');
        this.batchesCollection = mongoDb.collection('qr_batches');
    }

    async createQRCode(payload) {
        const result = await this.qrCodesCollection.insertOne(payload);
        return { id: result.insertedId, ...payload };
    }

    async createBatch(payload) {
        const result = await this.batchesCollection.insertOne(payload);
        return { id: result.insertedId, ...payload };
    }

    async findQRCodeById(id) {
        return this.qrCodesCollection.findOne({ _id: { $eq: id } });
    }

    async findQRCodeByToken(token) {
        return this.qrCodesCollection.findOne({ token });
    }

    async findQRCodeByHumanToken(humanToken) {
        return this.qrCodesCollection.findOne({ humanToken });
    }

    async findQRCodesByUserId(userId) {
        return this.qrCodesCollection.find({ assignedUserId: userId }).sort({ createdAt: -1 }).toArray();
    }

    async findUnassignedQRCodes(limit = 50, cursor = null) {
        const query = { status: 'unassigned' };

        if (cursor) {
            try {
                const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
                const [cursorTime, cursorId] = decodedCursor.split(':');

                if (cursorTime && cursorId) {
                    query.$or = [
                        { createdAt: { $lt: new Date(cursorTime) } },
                        {
                            createdAt: new Date(cursorTime),
                            _id: { $lt: cursorId },
                        },
                    ];
                }
            } catch (error) {
                // Ignore malformed cursors
            }
        }

        return this.qrCodesCollection.find(query).sort({ createdAt: -1, _id: -1 }).limit(limit).toArray();
    }

    async findBatchesByDateRange(startDate, endDate) {
        return this.batchesCollection
            .find({
                createdAt: { $gte: startDate, $lt: endDate },
            })
            .project({ batchNumber: 1 })
            .sort({ createdAt: -1 })
            .toArray();
    }

    async findBatchById(id) {
        return this.batchesCollection.findOne({ _id: { $eq: id } });
    }

    async updateQRCode(qrCodeId, updates) {
        await this.qrCodesCollection.updateOne({ _id: { $eq: qrCodeId } }, { $set: updates });
        return this.findQRCodeById(qrCodeId);
    }

    async updateBatch(batchId, updates) {
        await this.batchesCollection.updateOne({ _id: { $eq: batchId } }, { $set: updates });
        return this.findBatchById(batchId);
    }
}

// Usage
const { MongoClient } = require('mongodb');
const { QRService } = require('@your-org/qr-service');

async function setupMongoDB() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();

    const db = client.db('myapp');
    const adapter = new MongoDBQRAdapter(db);
    const qrService = new QRService(adapter);

    // Now use qrService with MongoDB backend
    return qrService;
}

module.exports = { MongoDBQRAdapter, setupMongoDB };
