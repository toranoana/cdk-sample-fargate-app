import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

import { Construct } from 'constructs';

import { VpcSubnets } from './constructs/vpc-subnets';
import { VpcEndpoints } from './constructs/vpc-endpoints';
import { LoadBalancer } from './constructs/load-balancer';
import { SecurityGroups } from './constructs/security-groups';
import { RelationalDatabaseService } from './constructs/relational-database-service';
import { ElasticContainerService } from './constructs/elastic-container-service';

import { APP_PORT } from './settings';

export class SampleFargateAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { vpc, publicSubnets, appSubnets, dbSubnets } = new VpcSubnets(
      this,
      'VpcSubnets',
      {},
    );

    const { appSecurityGroup, dbSecurityGroup } = new SecurityGroups(
      this,
      'SecurityGroups',
      {
        vpc,
      },
    );

    new VpcEndpoints(this, 'VpcEndpoints', {
      vpc,
      appSubnets,
      appSecurityGroup,
    });

    const { apiTargetGroup, pageTargetGroup } = new LoadBalancer(
      this,
      'LoadBalancer',
      {
        vpc,
        vpcSubnets: publicSubnets,
      },
    );

    const { dbCluster } = new RelationalDatabaseService(
      this,
      'RelationalDatabaseService',
      {
        vpc,
        vpcSubnets: dbSubnets,
        securityGroup: dbSecurityGroup,
      },
    );

    dbSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(dbCluster.clusterEndpoint.port),
    );

    new ElasticContainerService(this, 'ElasticContainerService', {
      vpc,
      vpcSubnets: appSubnets,
      securityGroup: appSecurityGroup,
      dbCredential: dbCluster.secret!,
      databaseHost: dbCluster.clusterEndpoint.hostname,
      databasePort: dbCluster.clusterEndpoint.port,
      containerPort: APP_PORT,
      apiTargetGroup,
      pageTargetGroup,
    }).node.addDependency(dbCluster);
  }
}
