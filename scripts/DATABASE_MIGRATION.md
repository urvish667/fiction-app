# Database Migration Guide

This guide explains how to migrate data from the old PostgreSQL database to the new Azure PostgreSQL database.

## Prerequisites

1. Make sure you have Node.js and npm installed
2. Ensure your `.env` file contains the correct `DATABASE_URL` for the target Azure database:
   ```
   DATABASE_URL="postgresql://postgres:123@lita456@fablespace-azure-test-db.postgres.database.azure.com/fablespace_db"
   ```
3. The source database URL is hardcoded in the scripts as:
   ```
   postgresql://postgres:root@18.142.239.93:5432/fablespace_db
   ```

## Migration Steps

### 1. Test Database Connections

First, test that you can connect to both the source and target databases:

```bash
npm run test:db-connection
```

This will attempt to connect to both databases and report if the connections are successful.

### 2. Run the Migration

Once you've confirmed the connections work, run the migration script:

```bash
npm run migrate:database
```

This script will:
- Connect to both databases
- Transfer data from all tables except Genre and Tag
- Process data in chunks to avoid memory issues
- Log progress and any errors that occur

The migration may take some time depending on the amount of data.

### 3. Verify the Migration

After the migration completes, verify that the data was transferred correctly:

```bash
npm run verify:migration
```

This will compare the record counts between the source and target databases and report the status of each table.

## Troubleshooting

If you encounter any issues during the migration:

1. Check the error messages in the console output
2. Verify that both database connections are working
3. Ensure the target database schema is up to date (run Prisma migrations if needed)
4. For specific table errors, you can modify the migration script to retry just that table

### Common Issues

#### Comment Migration Errors

If you see errors like `Error migrating comment cm9psp1980009izgg710symom: Invalid prisma.comment.upsert() invocation`, this is likely due to one of the following:

- The parent comment doesn't exist in the target database
- The referenced story doesn't exist in the target database
- The referenced user doesn't exist in the target database

The updated script includes checks for these dependencies and will skip comments with missing dependencies rather than failing.

If you encounter issues specifically with comments, you can run just the comments migration:

```bash
npm run migrate:comments
```

This will only migrate the Comments and CommentLikes tables, which is useful if you've already migrated other tables successfully.

#### CommentLike Migration Errors

Similarly, CommentLike migration errors are usually due to missing referenced comments or users. The script now checks for these dependencies before attempting to migrate CommentLikes.

## Notes

- The migration script uses upsert operations, so it's safe to run multiple times
- Genre and Tag tables are intentionally excluded from the migration as requested
- The script processes data in chunks to avoid memory issues with large datasets
- If a specific record fails to migrate, the script will log the error and continue with other records
- Comments and CommentLikes are processed sequentially with proper dependency checks to ensure referential integrity
- The script checks for the existence of related records (users, stories, parent comments) before attempting to migrate dependent records
