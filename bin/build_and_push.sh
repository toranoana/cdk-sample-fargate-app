#!/bin/bash

cd $(dirname $0)/..

touch .env
source .env

export DATABASE_SSL_CA_URL=https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
REGION=ap-northeast-1

aws ecr get-login-password | \
  docker login --username AWS --password-stdin \
  "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

API_APP_REPOSITORY_URI=$(aws ecr describe-repositories \
    --repository-names $API_APP_REPOSITORY_NAME \
    --query "repositories[0].repositoryUri" \
    --output text 2>/dev/null)

if [ $? -ne 0 ]; then
  echo 'リポジトリがありません'
  exit 1
fi

PAGE_APP_REPOSITORY_URI=$(aws ecr describe-repositories \
    --repository-names $PAGE_APP_REPOSITORY_NAME \
    --query "repositories[0].repositoryUri" \
    --output text 2>/dev/null)

if [ $? -ne 0 ]; then
  echo 'リポジトリがありません'
  exit 1
fi

docker build \
  --build-arg DATABASE_SSL_CA_URL=$DATABASE_SSL_CA_URL \
  --target prod \
  -t $API_APP_REPOSITORY_URI:latest apps/api

docker build \
  -t $PAGE_APP_REPOSITORY_URI:latest apps/page

docker push $API_APP_REPOSITORY_URI:latest
docker push $PAGE_APP_REPOSITORY_URI:latest
