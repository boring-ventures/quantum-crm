#!/usr/bin/env tsx

/**
 * Migration script to convert existing extraComments to the new comment system
 *
 * This script will:
 * 1. Find all leads with extraComments
 * 2. Create LeadComment records for each
 * 3. Preserve the original creation date and user
 *
 * Run with: npx tsx scripts/migrate-comments.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateComments() {
  console.log("🚀 Starting comment migration...");

  try {
    // Find all leads with extraComments
    const leadsWithComments = await prisma.lead.findMany({
      where: {
        extraComments: {
          not: null,
        },
      },
      include: {
        createdBy: true,
        assignedTo: true,
      },
    });

    console.log(
      `📊 Found ${leadsWithComments.length} leads with comments to migrate`
    );

    if (leadsWithComments.length === 0) {
      console.log("✅ No comments to migrate");
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const lead of leadsWithComments) {
      try {
        // Skip if already has comments
        const existingComments = await prisma.leadComment.count({
          where: { leadId: lead.id },
        });

        if (existingComments > 0) {
          console.log(`⏭️  Lead ${lead.id} already has comments, skipping...`);
          skippedCount++;
          continue;
        }

        // Determine the user to assign the comment to
        const userId = lead.createdById || lead.assignedToId;

        if (!userId) {
          console.log(
            `⚠️  Lead ${lead.id} has no user to assign comment to, skipping...`
          );
          skippedCount++;
          continue;
        }

        // Create the comment
        await prisma.leadComment.create({
          data: {
            content: lead.extraComments!,
            leadId: lead.id,
            userId: userId,
            createdAt: lead.createdAt, // Preserve original creation date
            updatedAt: lead.updatedAt,
          },
        });

        console.log(`✅ Migrated comment for lead ${lead.id}`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Error migrating lead ${lead.id}:`, error);
        skippedCount++;
      }
    }

    console.log("\n🎉 Migration completed!");
    console.log(`📈 Successfully migrated: ${migratedCount} comments`);
    console.log(`⏭️  Skipped: ${skippedCount} leads`);
    console.log(`📊 Total processed: ${leadsWithComments.length} leads`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateComments().catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
}

export { migrateComments };
