# Secure Environment Variables Management

This document outlines best practices for managing environment variables securely in the FableSpace application, especially for production deployments.

## Security Concerns

Hardcoding sensitive information like database credentials, API keys, and encryption keys in Docker configurations poses several security risks:

1. **Exposure in Image History**: Credentials become part of the Docker image history
2. **Container Inspection**: Sensitive data is visible in `docker inspect` output
3. **Logging**: Credentials might appear in logs
4. **Version Control**: If committed to version control, credentials are exposed to anyone with repository access
5. **Shared Configuration**: Anyone with access to configuration files can see sensitive data

## Best Practices for Different Environments

### Development Environment

For local development:

1. Use `.env` files with restricted permissions (600)
2. Add `.env` to `.gitignore` to prevent accidental commits
3. Provide a `.env.example` file with dummy values as a template
4. Use different credentials for development than production

Example `.env.example`:
```
DATABASE_URL=postgresql://username:password@hostname:port/database
NEXTAUTH_SECRET=your-nextauth-secret
JWT_ENCRYPTION_KEY=your-jwt-encryption-key
```

### Testing Environment

For CI/CD pipelines and testing:

1. Use environment variables provided by the CI/CD platform
2. Use temporary credentials with limited permissions
3. Rotate credentials regularly

### Production Environment

For production deployments, use one of these approaches:

#### 1. Azure Key Vault (Recommended for FableSpace)

Store secrets in Azure Key Vault and inject them during deployment:

```bash
# Example: Fetching secrets from Azure Key Vault
DATABASE_PASSWORD=$(az keyvault secret show --name db-password --vault-name fablespace-vault --query value -o tsv)

# Inject into container
docker run -e DATABASE_URL="postgresql://postgres:$DATABASE_PASSWORD@hostname/database" fablespace-app
```

#### 2. Docker Secrets (for Docker Swarm)

```yaml
version: '3.8'

services:
  app:
    image: fablespace-app
    secrets:
      - db_password
      - jwt_secret
    environment:
      - DATABASE_HOST=hostname
      - DATABASE_USER=username
      - DATABASE_NAME=database

secrets:
  db_password:
    external: true
  jwt_secret:
    external: true
```

#### 3. Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: fablespace-secrets
type: Opaque
data:
  database-password: base64encodedpassword
  jwt-secret: base64encodedsecret
```

Then reference in deployment:

```yaml
env:
  - name: DATABASE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: fablespace-secrets
        key: database-password
```

#### 4. Environment Variables from CI/CD Pipeline

```yaml
version: '3.8'

services:
  app:
    image: fablespace-app
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - JWT_ENCRYPTION_KEY=${JWT_ENCRYPTION_KEY}
```

## Implementation for FableSpace

### 1. Development Setup

1. Use `.env` file locally (not committed to git)
2. Provide `.env.example` with dummy values
3. Use Docker Compose with `env_file` directive

### 2. Production Setup

1. Store secrets in Azure Key Vault
2. Use Azure DevOps or GitHub Actions to:
   - Retrieve secrets during deployment
   - Inject them as environment variables
   - Deploy containers with proper configuration

### 3. Runtime Configuration

For the FableSpace application:

1. Use a configuration service that loads environment variables at startup
2. Implement secret rotation without container restarts
3. Log access to sensitive configuration

## Security Checklist

- [ ] No hardcoded credentials in Dockerfiles or docker-compose.yml
- [ ] Environment files excluded from version control
- [ ] Different credentials for development and production
- [ ] Secrets stored in a secure vault service
- [ ] Regular credential rotation
- [ ] Least privilege principle applied to all credentials
- [ ] Audit logging for access to sensitive configuration

## References

- [Docker Secrets documentation](https://docs.docker.com/engine/swarm/secrets/)
- [Azure Key Vault documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [OWASP Secure Configuration Practices](https://owasp.org/www-project-secure-headers/)
