import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as logs from 'aws-cdk-lib/aws-logs';

import { Construct } from 'constructs';

interface Props {
  vpc: ec2.Vpc;
  vpcSubnets: ec2.SubnetSelection;
  securityGroup: ec2.SecurityGroup;
}

export class RelationalDatabaseService extends Construct {
  public readonly dbCluster: rds.DatabaseCluster;

  constructor(
    scope: Construct,
    id: string,
    { vpc, vpcSubnets, securityGroup }: Props,
  ) {
    super(scope, id);

    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      vpcSubnets,
      description: 'Database subnet group',
    });

    const engine = rds.DatabaseClusterEngine.auroraMysql({
      version: rds.AuroraMysqlEngineVersion.VER_3_07_0,
    });

    const parameterGroup = new rds.ParameterGroup(
      this,
      'DatabaseParameterGroup',
      {
        engine,
        parameters: {
          character_set_client: 'utf8mb4',
          character_set_connection: 'utf8mb4',
          character_set_database: 'utf8mb4',
          character_set_results: 'utf8mb4',
          character_set_server: 'utf8mb4',
          time_zone: 'Asia/Tokyo',
          aurora_parallel_query: '1',
          slow_query_log: '1',
        },
      },
    );

    const databaseInstanceOptions: rds.ProvisionedClusterInstanceProps = {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM,
      ),
      // db.t3 では Performance Insights を有効にできない。
      // https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_PerfInsights.Overview.Engines.html
      // Performance Insightsに対応しているインスタンスタイプの場合は以下で有効化可能
      // enablePerformanceInsights: true,
      // performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
    };

    const defaultDatabaseName = 'app';
    this.dbCluster = new rds.DatabaseCluster(this, 'Database', {
      vpc,
      subnetGroup,
      engine,
      credentials: rds.Credentials.fromGeneratedSecret('app_user'),
      parameterGroup,
      defaultDatabaseName,
      writer: rds.ClusterInstance.provisioned(
        'instance1',
        databaseInstanceOptions,
      ),
      readers: [
        rds.ClusterInstance.provisioned('instance2', databaseInstanceOptions),
      ],
      securityGroups: [securityGroup],
      monitoringInterval: cdk.Duration.minutes(1),
      cloudwatchLogsRetention: logs.RetentionDays.ONE_YEAR,
      cloudwatchLogsExports: ['audit', 'error', 'slowquery'],
      backup: {
        retention: cdk.Duration.days(7),
        // UTC 19:00-20:00 -> JST 04:00-05:00
        preferredWindow: '19:00-20:00',
      },
    });
  }
}
