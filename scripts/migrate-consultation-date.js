const { MongoClient } = require("mongodb");
require("dotenv").config();

async function migrateConsultationDate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not defined in environment variables");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected successfully");

    const db = client.db();
    const customers = db.collection("customers");

    // Find all customers with lastConsentFormDate
    const docs = await customers
      .find({ lastConsentFormDate: { $exists: true } })
      .toArray();
    console.log(`Found ${docs.length} customers with lastConsentFormDate`);

    // Update each customer
    for (const doc of docs) {
      console.log(`Processing customer ${doc._id}...`);

      // Update the document to use the new field name
      const result = await customers.updateOne(
        { _id: doc._id },
        {
          $set: { lastConsultationFormDate: doc.lastConsentFormDate },
          $unset: { lastConsentFormDate: "" },
        }
      );

      console.log(
        `Updated customer ${doc._id}:`,
        result.modifiedCount > 0 ? "success" : "no changes"
      );
    }

    // Also update any customers that might have the new field name but null value
    const nullUpdates = await customers.updateMany(
      { lastConsultationFormDate: null },
      { $set: { lastConsultationFormDate: null } }
    );
    console.log(
      `Updated ${nullUpdates.modifiedCount} customers with null lastConsultationFormDate`
    );

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

migrateConsultationDate().catch(console.error);
