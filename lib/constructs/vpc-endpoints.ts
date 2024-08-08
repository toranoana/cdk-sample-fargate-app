import * as ec2 from 'aws-cdk-lib/aws-ec2';

import { Construct } from 'constructs';

interface Props {
  vpc: ec2.Vpc;
  appSubnets: ec2.SelectedSubnets;
  appSecurityGroup: ec2.SecurityGroup;
}

export class VpcEndpoints extends Construct {
  constructor(
    scope: Construct,
    id: string,
    { vpc, appSubnets, appSecurityGroup }: Props,
  ) {
    super(scope, id);

    vpc.addInterfaceEndpoint('ECREndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      securityGroups: [appSecurityGroup],
      subnets: appSubnets,
    });
    vpc.addInterfaceEndpoint('ECRDockerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      securityGroups: [appSecurityGroup],
      subnets: appSubnets,
    });
    vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      securityGroups: [appSecurityGroup],
      subnets: appSubnets,
    });
    vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      securityGroups: [appSecurityGroup],
      subnets: appSubnets,
    });
    vpc.addInterfaceEndpoint('SSMEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      securityGroups: [appSecurityGroup],
      subnets: appSubnets,
    });
    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.S3,
      subnets: [appSubnets],
    });
  }
}
