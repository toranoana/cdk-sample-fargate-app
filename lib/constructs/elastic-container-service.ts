import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

import { Construct } from 'constructs';

import {
  APP_PORT,
  API_APP_CONTAINER_TAG,
  API_APP_REPOSITORY_NAME,
  PAGE_APP_CONTAINER_TAG,
  PAGE_APP_REPOSITORY_NAME,
} from '../settings';

interface Props {
  vpc: ec2.Vpc;
  vpcSubnets: ec2.SubnetSelection;
  securityGroup: ec2.SecurityGroup;
  dbCredential: secretsmanager.ISecret;
  databaseHost: string;
  databasePort: number;
  containerPort: number;
  apiTargetGroup: elbv2.ApplicationTargetGroup;
  pageTargetGroup: elbv2.ApplicationTargetGroup;
}

export class ElasticContainerService extends Construct {
  constructor(
    scope: Construct,
    id: string,
    {
      vpc,
      vpcSubnets,
      securityGroup,
      dbCredential,
      databaseHost,
      databasePort,
      containerPort,
      apiTargetGroup,
      pageTargetGroup,
    }: Props,
  ) {
    super(scope, id);

    const apiRepo = API_APP_REPOSITORY_NAME
      ? new ecr.Repository(this, 'ApiAppEcrRepository', {
          repositoryName: API_APP_REPOSITORY_NAME,
        })
      : undefined;

    const pageRepo = PAGE_APP_REPOSITORY_NAME
      ? new ecr.Repository(this, 'PageAppEcrRepository', {
          repositoryName: PAGE_APP_REPOSITORY_NAME,
        })
      : undefined;

    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      vpc,
    });

    const namespace = cluster.addDefaultCloudMapNamespace({
      name: 'sample-app.local',
    });

    if (apiRepo && API_APP_CONTAINER_TAG) {
      const taskDefinition = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
        cpu: 256,
        memoryLimitMiB: 512,
        runtimePlatform: {
          cpuArchitecture: ecs.CpuArchitecture.ARM64,
        },
      });

      const appPortName = 'api';
      new ecs.ContainerDefinition(this, 'ApiContainer', {
        containerName: 'api',
        taskDefinition,
        image: ecs.ContainerImage.fromEcrRepository(
          apiRepo,
          process.env.API_APP_CONTAINER_TAG,
        ),
        linuxParameters: new ecs.LinuxParameters(
          this,
          'ApiContainerLinuxParams',
          {
            initProcessEnabled: true,
          },
        ),
        logging: new ecs.AwsLogDriver({
          streamPrefix: 'api',
          logRetention: logs.RetentionDays.ONE_YEAR,
        }),
        portMappings: [
          {
            name: appPortName,
            containerPort,
          },
        ],
        environment: {
          DATABASE_HOST: databaseHost,
          DATABASE_PORT: databasePort.toString(),
        },
        secrets: {
          DATABASE_NAME: ecs.Secret.fromSecretsManager(dbCredential, 'dbname'),
          DATABASE_USER: ecs.Secret.fromSecretsManager(
            dbCredential,
            'username',
          ),
          DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(
            dbCredential,
            'password',
          ),
        },
      });

      dbCredential.grantRead(taskDefinition.executionRole!);

      const service = new ecs.FargateService(this, 'ApiService', {
        vpcSubnets,
        securityGroups: [securityGroup],
        cluster,
        taskDefinition,
        platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
        circuitBreaker: {
          enable: true,
          rollback: true,
        },
        serviceConnectConfiguration: {
          namespace: namespace.namespaceName,
          services: [
            {
              portMappingName: appPortName,
              port: APP_PORT,
              discoveryName: 'api',
            },
          ],
        },
        enableExecuteCommand: true,
      });
      apiTargetGroup.addTarget(service);
      service.node.addDependency(namespace);
    }

    if (pageRepo && PAGE_APP_CONTAINER_TAG) {
      const taskDefinition = new ecs.FargateTaskDefinition(
        this,
        'PageTaskDef',
        {
          cpu: 256,
          memoryLimitMiB: 512,
          runtimePlatform: {
            cpuArchitecture: ecs.CpuArchitecture.ARM64,
          },
        },
      );

      const appPortName = 'page';
      new ecs.ContainerDefinition(this, 'PageContainer', {
        containerName: 'page',
        taskDefinition,
        image: ecs.ContainerImage.fromEcrRepository(
          pageRepo,
          process.env.PAGE_APP_CONTAINER_TAG,
        ),
        linuxParameters: new ecs.LinuxParameters(
          this,
          'PageContainerLinuxParams',
          {
            initProcessEnabled: true,
          },
        ),
        logging: new ecs.AwsLogDriver({
          streamPrefix: 'page',
          logRetention: logs.RetentionDays.ONE_YEAR,
        }),
        portMappings: [
          {
            name: appPortName,
            containerPort,
          },
        ],
        environment: {
          API_URL: `http://api.${namespace.namespaceName}:${APP_PORT}/api/samples`,
        },
      });

      const service = new ecs.FargateService(this, 'PageService', {
        vpcSubnets,
        securityGroups: [securityGroup],
        cluster,
        taskDefinition,
        platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
        circuitBreaker: {
          enable: true,
          rollback: true,
        },
        serviceConnectConfiguration: {
          namespace: namespace.namespaceName,
          services: [
            {
              portMappingName: appPortName,
              port: APP_PORT,
              discoveryName: 'page',
            },
          ],
        },
        enableExecuteCommand: true,
      });
      pageTargetGroup.addTarget(service);
      service.node.addDependency(namespace);
    }
  }
}
