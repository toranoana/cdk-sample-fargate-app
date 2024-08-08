// #!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SampleFargateAppStack } from '../lib/sample-fargate-app-stack';

const app = new cdk.App();
new SampleFargateAppStack(app, 'SampleFargateAppStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
  },
  // cdk destroyを禁止するには以下の設定を追加します。
  // terminationProtection: true,
});
