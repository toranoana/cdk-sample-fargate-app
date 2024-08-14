#!/bin/bash

cd $(dirname $0)/..

touch .env
source .env

export API_APP_REPOSITORY_NAME=${API_APP_REPOSITORY_NAME:-api-app}
export PAGE_APP_REPOSITORY_NAME=${PAGE_APP_REPOSITORY_NAME:-page-app}
export CDK_DEFAULT_REGION
export AWS_DEFAULT_REGION=${CDK_DEFAULT_REGION:-ap-northeast-1}
export ACM_ARN

aws ecr describe-repositories \
  --repository-names $API_APP_REPOSITORY_NAME \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
  export API_APP_CONTAINER_TAG=$(aws ecr describe-images \
    --repository-name $API_APP_REPOSITORY_NAME \
    --query 'imageDetails[?imageTags[?contains(@, `latest`)]].imageDigest' \
    --output text)
fi

aws ecr describe-repositories \
  --repository-names $PAGE_APP_REPOSITORY_NAME \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
  export PAGE_APP_CONTAINER_TAG=$(aws ecr describe-images \
    --repository-name $PAGE_APP_REPOSITORY_NAME \
    --query 'imageDetails[?imageTags[?contains(@, `latest`)]].imageDigest' \
    --output text)
fi

npm run cdk -- deploy
