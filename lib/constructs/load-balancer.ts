import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

import { Construct } from 'constructs';

import { APP_PORT, ACM_ARN } from '../settings';

interface Props {
  vpc: ec2.Vpc;
  vpcSubnets: ec2.SubnetSelection;
}

export class LoadBalancer extends Construct {
  public readonly apiTargetGroup: elbv2.ApplicationTargetGroup;
  public readonly pageTargetGroup: elbv2.ApplicationTargetGroup;

  constructor(scope: Construct, id: string, { vpc, vpcSubnets }: Props) {
    super(scope, id);
    const alb = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc,
      internetFacing: true,
      vpcSubnets,
    });

    const appListener = alb.addListener(
      ACM_ARN ? 'HttpsListener' : 'HttpListener',
      {
        port: ACM_ARN ? 443 : 80,
        protocol: ACM_ARN
          ? elbv2.ApplicationProtocol.HTTPS
          : elbv2.ApplicationProtocol.HTTP,
        certificates: ACM_ARN
          ? [elbv2.ListenerCertificate.fromArn(ACM_ARN)]
          : undefined,
        defaultAction: elbv2.ListenerAction.fixedResponse(404, {
          contentType: 'text/plain',
          messageBody: 'Not Found',
        }),
      },
    );

    if (ACM_ARN) {
      // httpsにリダイレクトする設定
      alb.addListener('HttpListener', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultAction: elbv2.ListenerAction.redirect({
          protocol: 'HTTPS',
          port: '443',
          permanent: true,
        }),
      });
    }

    this.apiTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'ApiTargetGroup',
      {
        vpc,
        port: APP_PORT,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/healthCheck',
        },
      },
    );

    this.pageTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'PageTargetGroup',
      {
        vpc,
        port: APP_PORT,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/healthCheck',
        },
      },
    );

    appListener.addTargetGroups('ApiTargetGroup', {
      priority: 100,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*'])],
      targetGroups: [this.apiTargetGroup],
    });
    appListener.addTargetGroups('PageTargetGroup', {
      priority: 200,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/*'])],
      targetGroups: [this.pageTargetGroup],
    });

    const protocal = ACM_ARN ? 'https' : 'http';
    new cdk.CfnOutput(this, 'OutputApplicationUrl', {
      exportName: 'ApplicationUrl',
      value: `${protocal}://${alb.loadBalancerDnsName}`,
    });
  }
}
