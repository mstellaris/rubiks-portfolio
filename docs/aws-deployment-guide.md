# AWS Deployment Guide for Rubik's Portfolio

This guide covers options for deploying the Vite static site to AWS with the custom domain `miltos.io` via Route 53.

## Prerequisites

- AWS account with access to S3, CloudFront, Route 53, IAM, and Amplify
- Domain `miltos.io` already configured in Route 53
- GitHub repository for the project

---

## Option 1: AWS Amplify Hosting (Easiest - Similar to Vercel)

### Overview

AWS Amplify is a fully managed service that creates a complete CI/CD pipeline and CloudFront CDN behind the scenes. It's AWS's answer to Vercel/Netlify.

### Key Advantages

- **Automatic CI/CD**: Connects directly to your GitHub repo, builds and deploys on every push
- **Branch Deployments**: Each branch gets its own URL automatically
- **PR Previews**: Creates ephemeral environments for pull requests (auto-deleted when PR closes)
- **Automatic SSL**: Provisions and renews free SSL certificates via ACM
- **Instant Cache Invalidation**: Happens automatically on every deployment
- **Zero Config**: No need to manually configure S3, CloudFront, IAM, etc.

### Pricing

- **Build & Deploy**: $0.01 per build minute
- **Storage**: $0.023 per GB/month
- **Data Transfer**: $0.15 per GB served
- **Free Tier**: 6-month free plan or $200 credits for new AWS customers
- **Typical Cost**: $0-30/month for low-traffic sites

### Setup Steps

#### 1. Connect Your Repository

```
1. Sign in to AWS Management Console
2. Navigate to AWS Amplify
3. Choose "Host web app" → "GitHub"
4. Authorize AWS Amplify to access your GitHub account
5. Select repository: rubiks-portfolio
6. Select branch: main
```

#### 2. Configure Build Settings

Amplify auto-detects Vite projects, but you can customize with `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

#### 3. Add Custom Domain (miltos.io)

Since the domain is already in Route 53:

1. In Amplify Console → Your App → "Hosting" → "Custom domains"
2. Click "Add domain"
3. Enter `miltos.io` - Amplify will auto-detect it's in Route 53
4. Choose subdomain configuration:
   - Root domain: `miltos.io`
   - Include www: `www.miltos.io` (recommended)
5. Click "Configure domain"
6. **DNS records are added automatically** by AWS
7. SSL certificate is provisioned automatically (takes 5-20 minutes)

#### 4. Enable Branch Deployments (Optional)

```
App settings → Branch settings → Enable "Branch auto-detection"
App settings → Branch settings → Enable "Branch auto-disconnection"

This creates:
- main branch → miltos.io
- dev branch → dev.miltos.io (if you create one)
- PR #123 → pr-123.miltos.io (ephemeral)
```

#### 5. Enable PR Previews (Optional)

```
Hosting → Previews → Select "main" branch → Edit settings
Enable "Pull request previews"

Note: Only works with private repos for security
Quota: Up to 50 branches/previews per app
```

### Deployment Workflow

```bash
git add .
git commit -m "Update portfolio"
git push origin main
# → Amplify auto-detects push, builds, deploys (~2-6 minutes)
```

---

## Option 2: S3 + CloudFront + GitHub Actions (More Control)

### Overview

Traditional approach using S3 for storage, CloudFront for CDN, and GitHub Actions for CI/CD. More configuration required but gives complete control.

### Key Advantages

- **Lower Cost**: $1-5/month for low-traffic sites
- **Complete Control**: Fine-grained control over S3 policies, CloudFront behaviors, cache policies
- **Learning Opportunity**: Understand AWS fundamentals
- **Portable**: Easy to replicate setup for multiple sites

### Pricing

| Service | Cost |
|---------|------|
| S3 Storage | $0.023 per GB/month |
| S3 GET requests | $0.0004 per 1,000 |
| CloudFront Data Transfer | $0.085 per GB (US/Canada) |
| Route 53 Hosted Zone | $0.50/month |
| ACM Certificates | FREE |

**Real-World Example**: 500 visitors/month → ~$0.93/month total

### Architecture

```
[GitHub Repo] → [GitHub Actions OIDC] → [S3 Bucket]
                                           ↓
                                    [CloudFront CDN]
                                           ↓
                                    [Route 53 DNS]
                                           ↓
                                      [miltos.io]
```

### Setup Steps

#### 1. Create S3 Bucket

```
1. Navigate to S3 → Create bucket
2. Bucket name: miltos-io-portfolio (must be globally unique)
3. Region: us-east-1 (or preferred region)
4. Block Public Access: Keep ENABLED (CloudFront will access via OAC)
5. Bucket Versioning: Disabled (optional: enable for rollback)
6. Default encryption: Enabled (SSE-S3)
7. Create bucket

DO NOT enable "Static website hosting" on S3
(CloudFront handles this for better performance)
```

#### 2. Request SSL Certificate (ACM)

**CRITICAL: Must be in us-east-1 region for CloudFront**

```
1. Navigate to AWS Certificate Manager
2. ENSURE you're in us-east-1 region (N. Virginia)
3. Request a public certificate
4. Domain names:
   - miltos.io
   - *.miltos.io (wildcard for subdomains)
5. Validation method: DNS validation
6. Click "Request"
7. Click "Create records in Route 53" (auto-adds validation records)
8. Wait 5-30 minutes for validation (status: "Issued")
```

#### 3. Create Origin Access Control (OAC)

```
1. Navigate to CloudFront → Security → Origin access
2. Click "Create control setting"
3. Name: miltos-io-oac
4. Signing behavior: "Sign requests (recommended)"
5. Origin type: S3
6. Create
```

#### 4. Create CloudFront Distribution

```
Origin settings:
- Origin domain: miltos-io-portfolio.s3.us-east-1.amazonaws.com
- Origin access: Origin access control settings
- Origin access control: Select "miltos-io-oac"

Default cache behavior:
- Viewer protocol policy: Redirect HTTP to HTTPS
- Allowed HTTP methods: GET, HEAD
- Cache policy: CachingOptimized

Settings:
- Alternate domain names (CNAMEs): miltos.io, www.miltos.io
- SSL certificate: Select your ACM cert
- Default root object: index.html

Custom error responses (for SPA routing):
- 403 → /index.html (200)
- 404 → /index.html (200)
```

#### 5. Update S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": {
    "Sid": "AllowCloudFrontServicePrincipal",
    "Effect": "Allow",
    "Principal": {
      "Service": "cloudfront.amazonaws.com"
    },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::miltos-io-portfolio/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
      }
    }
  }
}
```

#### 6. Configure Route 53 DNS Records

```
1. Navigate to Route 53 → Hosted zones → miltos.io

2. Create A record for root domain:
   - Record name: (empty)
   - Record type: A
   - Alias: YES
   - Route traffic to: CloudFront distribution

3. Create A record for www:
   - Record name: www
   - Record type: A
   - Alias: YES
   - Route traffic to: CloudFront distribution

4. Optional: Create AAAA records for IPv6 (same process)
```

#### 7. Set Up GitHub Actions CI/CD

**Step 7a: Create OIDC Provider in AWS IAM**

```
1. Navigate to IAM → Identity providers → Add provider
2. Provider type: OpenID Connect
3. Provider URL: https://token.actions.githubusercontent.com
4. Audience: sts.amazonaws.com
5. Add provider
```

**Step 7b: Create IAM Role for GitHub Actions**

Trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/rubiks-portfolio:*"
        }
      }
    }
  ]
}
```

Permissions policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::miltos-io-portfolio",
        "arn:aws:s3:::miltos-io-portfolio/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
    }
  ]
}
```

**Step 7c: Create GitHub Actions Workflow**

Create `.github/workflows/deploy-aws.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Vite project
        run: npm run build

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::YOUR_ACCOUNT_ID:role/GitHubActionsDeployRole
          aws-region: us-east-1

      - name: Sync files to S3
        run: |
          # Assets with long cache
          aws s3 sync ./dist s3://miltos-io-portfolio --delete \
            --cache-control "public, max-age=31536000, immutable" \
            --exclude "*.html"

          # HTML files with short cache
          aws s3 sync ./dist s3://miltos-io-portfolio --delete \
            --cache-control "public, max-age=0, must-revalidate" \
            --exclude "*" \
            --include "*.html"

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id YOUR_DISTRIBUTION_ID \
            --paths "/*"
```

### Deployment Workflow

```bash
git add .
git commit -m "Update portfolio"
git push origin main
# → GitHub Actions builds, syncs to S3, invalidates CloudFront (~2-5 minutes)
```

---

## Option 3: AWS CodePipeline + CodeBuild (AWS-Native CI/CD)

### Overview

Fully AWS-native CI/CD without relying on GitHub Actions. Good if you want everything in AWS or have existing AWS expertise.

### Key Advantages

- Everything in AWS ecosystem
- Integrated with CloudWatch for monitoring
- Serverless (only pay when building)

### Pricing

- **CodePipeline**: $1/month per active pipeline
- **CodeBuild**: $0.005/minute (x86)
- **Free Tier**: 100 build minutes/month

### Setup Steps

#### 1. Create buildspec.yml

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - npm ci

  build:
    commands:
      - npm run build

  post_build:
    commands:
      - aws s3 sync ./dist s3://${S3_BUCKET} --delete \
          --cache-control "public, max-age=31536000" --exclude "*.html"
      - aws s3 sync ./dist s3://${S3_BUCKET} --delete \
          --cache-control "public, max-age=0, must-revalidate" --include "*.html"
      - aws cloudfront create-invalidation \
          --distribution-id ${CLOUDFRONT_ID} --paths "/*"

artifacts:
  files:
    - '**/*'
  base-directory: dist
```

#### 2. Create CodeBuild Project

```
1. Navigate to CodeBuild → Create project
2. Project name: rubiks-portfolio-build
3. Source: GitHub (connect via OAuth or GitHub App)
4. Repository: rubiks-portfolio
5. Environment:
   - Managed image, Amazon Linux
   - Image: aws/codebuild/standard:7.0
6. Environment variables:
   - S3_BUCKET: miltos-io-portfolio
   - CLOUDFRONT_ID: YOUR_DISTRIBUTION_ID
7. Create project
```

#### 3. Update CodeBuild IAM Role

Add S3 and CloudFront permissions to the auto-created service role (same as GitHub Actions permissions above).

#### 4. Create CodePipeline

```
1. Navigate to CodePipeline → Create pipeline
2. Pipeline name: rubiks-portfolio-pipeline
3. Source: GitHub (Version 2) with webhook
4. Build: AWS CodeBuild → rubiks-portfolio-build
5. Deploy: Skip (handled in buildspec.yml)
6. Create pipeline
```

### Deployment Workflow

```bash
git add .
git commit -m "Update portfolio"
git push origin main
# → CodePipeline triggers via webhook, builds and deploys (~3-8 minutes)
```

---

## Comparison Table

| Feature | Amplify | S3+CloudFront+GH Actions | CodePipeline |
|---------|---------|--------------------------|--------------|
| Setup Complexity | Easy | Moderate | Moderate |
| Monthly Cost | $0-30 | $1-5 | $2-8 |
| Auto CI/CD | ✅ Built-in | Manual setup | ✅ Built-in |
| Branch Deployments | ✅ Automatic | ❌ Manual | ❌ Manual |
| PR Previews | ✅ Automatic | ❌ | ❌ |
| Cache Invalidation | ✅ Automatic | Manual | Manual |
| SSL Certificate | ✅ Automatic | Manual (free) | Manual (free) |
| Build Time | 2-6 min | 2-5 min | 3-8 min |
| Custom Control | Limited | Full | High |

---

## Recommendations

### Choose Amplify if:

- You want the quickest setup (Vercel-like experience)
- You value automatic PR previews and branch deployments
- You want zero infrastructure management
- Budget of $0-30/month is acceptable

### Choose S3 + CloudFront + GitHub Actions if:

- You want to learn AWS fundamentals
- You need fine-grained control over infrastructure
- Cost optimization is important ($1-5/month)
- You already use GitHub Actions for other projects

### Choose CodePipeline if:

- You want everything in AWS ecosystem
- Corporate policy requires AWS-native solutions
- You need advanced build customization

---

## Cache Optimization Tips

### Versioned URLs Strategy

Instead of invalidating cache on every deploy, use versioned filenames:

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
}
```

Benefits:
- Assets have unique hashes → cache forever
- Only invalidate `/index.html` (1 path, always free)
- Faster deployments, lower costs

---

## Useful Resources

### AWS Amplify
- [AWS Amplify Pricing](https://aws.amazon.com/amplify/pricing/)
- [Adding Custom Domain with Route 53](https://docs.aws.amazon.com/amplify/latest/userguide/to-add-a-custom-domain-managed-by-amazon-route-53.html)
- [PR Previews](https://docs.aws.amazon.com/amplify/latest/userguide/pr-previews.html)

### S3 + CloudFront
- [CloudFront OAC Documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [Route 53 Record Types](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html)

### GitHub Actions + AWS
- [Configuring OIDC in AWS](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)

### CodePipeline
- [CodeBuild buildspec Reference](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)
