# Recommendation Generator - Azure Container Job

This is a containerized application designed to run as an Azure Container Job for generating story recommendations based on genre and tag similarity.

## Features

- **Cosine Similarity Algorithm**: Uses cosine similarity to compute story recommendations based on genres and tags
- **Configurable Parameters**: Adjustable similarity threshold, maximum recommendations per story, and author exclusion
- **Production Ready**: Optimized Docker image with proper logging, error handling, and graceful shutdown
- **Health Checks**: Built-in health check endpoint for container orchestration
- **Security**: Runs as non-root user with minimal attack surface

## Configuration

The application is configured through environment variables:

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string

### Optional Variables

- `MAX_RECOMMENDATIONS_PER_STORY`: Maximum number of recommendations per story (default: 10)
- `SIMILARITY_THRESHOLD`: Minimum similarity score to consider (default: 0.1)
- `EXCLUDE_SAME_AUTHOR`: Whether to exclude stories by the same author (default: false)
- `LOG_LEVEL`: Logging level - error, warn, info, debug (default: info)
- `NODE_ENV`: Environment - development, production (default: production)

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database connection string
   ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Run in development mode:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Docker Usage

### Build the image:
```bash
docker build -t recommendation-generator .
```

### Run locally:
```bash
docker run --env-file .env recommendation-generator
```

### Health check:
```bash
docker run recommendation-generator node dist/index.js --health-check
```

## Azure Container Jobs Deployment

### 1. Build and Push to Azure Container Registry

```bash
# Login to Azure
az login

# Create resource group (if not exists)
az group create --name myResourceGroup --location eastus

# Create Azure Container Registry
az acr create --resource-group myResourceGroup --name myregistry --sku Basic

# Login to ACR
az acr login --name myregistry

# Build and push image
docker build -t myregistry.azurecr.io/recommendation-generator:latest .
docker push myregistry.azurecr.io/recommendation-generator:latest
```

### 2. Create Container Apps Environment

```bash
# Create Container Apps Environment
az containerapp env create \
  --name myContainerEnv \
  --resource-group myResourceGroup \
  --location eastus
```

### 3. Create Container Job

```bash
# Create the container job
az containerapp job create \
  --name "recommendation-generator" \
  --resource-group "myResourceGroup" \
  --environment "myContainerEnv" \
  --image "myregistry.azurecr.io/recommendation-generator:latest" \
  --cpu 2 \
  --memory 4Gi \
  --replica-timeout 3600 \
  --replica-retry-limit 3 \
  --trigger-type Manual \
  --env-vars "DATABASE_URL=secretref:database-url" \
            "MAX_RECOMMENDATIONS_PER_STORY=10" \
            "SIMILARITY_THRESHOLD=0.1" \
            "LOG_LEVEL=info"
```

### 4. Set up Secrets

```bash
# Add database URL as secret
az containerapp job secret set \
  --name "recommendation-generator" \
  --resource-group "myResourceGroup" \
  --secrets "database-url=postgresql://user:pass@host:port/db"
```

### 5. Execute Job

```bash
# Manual execution
az containerapp job start \
  --name "recommendation-generator" \
  --resource-group "myResourceGroup"

# Check execution status
az containerapp job execution list \
  --name "recommendation-generator" \
  --resource-group "myResourceGroup"
```

### 6. Schedule Job (Optional)

```bash
# Update job to run on schedule (daily at 2 AM)
az containerapp job update \
  --name "recommendation-generator" \
  --resource-group "myResourceGroup" \
  --trigger-type Schedule \
  --cron-expression "0 2 * * *"
```

## Monitoring and Logs

### View job logs:
```bash
az containerapp job execution logs show \
  --name "recommendation-generator" \
  --resource-group "myResourceGroup" \
  --job-execution-name <execution-name>
```

### Monitor job executions:
```bash
az containerapp job execution list \
  --name "recommendation-generator" \
  --resource-group "myResourceGroup" \
  --output table
```

## Performance Considerations

- **Memory**: Allocate 2-4GB depending on your dataset size
- **CPU**: 1-2 vCPUs should be sufficient for most workloads
- **Timeout**: Set replica timeout to 30-60 minutes depending on data size
- **Batch Processing**: The service processes stories in batches to optimize memory usage

## Security

- Container runs as non-root user (nodejs:1001)
- Minimal base image (Alpine Linux)
- No unnecessary packages or tools
- Environment variables for sensitive configuration
- Proper signal handling for graceful shutdown

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**: Verify DATABASE_URL and network connectivity
2. **Memory Issues**: Increase memory allocation or reduce batch size
3. **Timeout Issues**: Increase replica-timeout value
4. **Permission Issues**: Ensure ACR access and proper RBAC settings

### Debug Mode:
Set `LOG_LEVEL=debug` for verbose logging during troubleshooting.

## License

MIT License - see LICENSE file for details.
