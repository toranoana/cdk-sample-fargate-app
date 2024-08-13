#!/bin/bash

cd $(dirname $0)/..

touch .env
source .env

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

export API_APP_REPOSITORY_NAME
export PAGE_APP_REPOSITORY_NAME
export ACM_ARN

npm run cdk -- deploy
