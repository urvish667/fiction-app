# Scheduled Chapters Processor - Azure Container Job

This is a containerized application designed to run as an Azure Container Job for processing scheduled chapters that are due for publishing.

## Features

- **Automated Chapter Publishing**: Processes scheduled chapters and publishes them when their publish date is reached
- **Story Status Updates**: Automatically updates story status based on published chapters
- **Production Ready**: Optimized Docker image with proper logging, error handling, and graceful shutdown
- **Health Checks**: Built-in health check endpoint for container orchestration
- **Security**: Runs as non-root user with minimal attack surface

## Configuration

The application is configured through environment variables:

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string

### Optional Variables

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
docker build -t scheduled-chapters-processor .
```

### Run locally:
```bash
docker run --env-file .env scheduled-chapters-processor
```

### Health check:
```bash
docker run scheduled-chapters-processor node dist/index.js --health-check
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
docker build -t myregistry.azurecr.io/scheduled-chapters-processor:latest .
docker push myregistry.azurecr.io/scheduled-chapters-processor:latest
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
  --name "scheduled-chapters-processor" \
  --resource-group "myResourceGroup" \
  --environment "myContainerEnv" \
  --image "myregistry.azurecr.io/scheduled-chapters-processor:latest" \
  --cpu 1 \
  --memory 2Gi \
  --replica-timeout 1800 \
  --replica-retry-limit 3 \
  --trigger-type Manual \
  --env-vars "DATABASE_URL=secretref:database-url" \
            "LOG_LEVEL=info"
```

### 4. Set up Secrets

```bash
# Add database URL as secret
az containerapp job secret set \
  --name "scheduled-chapters-processor" \
  --resource-group "myResourceGroup" \
  --secrets "database-url=postgresql://user:pass@host:port/db"
```

### 5. Execute Job

```bash
# Manual execution
az containerapp job start \
  --name "scheduled-chapters-processor" \
  --resource-group "myResourceGroup"

# Check execution status
az containerapp job execution list \
  --name "scheduled-chapters-processor" \
  --resource-group "myResourceGroup"
```

### 6. Schedule Job (Optional)

```bash
# Update job to run on schedule (every 15 minutes)
az containerapp job update \
  --name "scheduled-chapters-processor" \
  --resource-group "myResourceGroup" \
  --trigger-type Schedule \
  --cron-expression "*/15 * * * *"
```

## Monitoring and Logs

### View job logs:
```bash
az containerapp job execution logs show \
  --name "scheduled-chapters-processor" \
  --resource-group "myResourceGroup" \
  --job-execution-name <execution-name>
```

### Monitor job executions:
```bash
az containerapp job execution list \
  --name "scheduled-chapters-processor" \
  --resource-group "myResourceGroup" \
  --output table
```

## Performance Considerations

- **Memory**: 1-2GB should be sufficient for most workloads
- **CPU**: 1 vCPU is typically adequate
- **Timeout**: Set replica timeout to 30 minutes for safety
- **Frequency**: Recommended to run every 15 minutes for timely chapter publishing

## Security

- Container runs as non-root user (nodejs:1001)
- Minimal base image (Alpine Linux)
- No unnecessary packages or tools
- Environment variables for sensitive configuration
- Proper signal handling for graceful shutdown

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**: Verify DATABASE_URL and network connectivity
2. **Memory Issues**: Increase memory allocation if processing large batches
3. **Timeout Issues**: Increase replica-timeout value
4. **Permission Issues**: Ensure ACR access and proper RBAC settings

### Debug Mode:
Set `LOG_LEVEL=debug` for verbose logging during troubleshooting.

## License

MIT License - see LICENSE file for details.
