import * as ec2 from 'aws-cdk-lib/aws-ec2';

import { Construct } from 'constructs';

import { USE_NAT_GATEWAY } from '../settings';

interface Props {
  cidr?: string;
}

export class VpcSubnets extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.SelectedSubnets;
  public readonly appSubnets: ec2.SelectedSubnets;
  public readonly dbSubnets: ec2.SelectedSubnets;

  constructor(scope: Construct, id: string, { cidr }: Props) {
    super(scope, id);
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr(cidr || '10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'App',
          subnetType: USE_NAT_GATEWAY
            ? ec2.SubnetType.PRIVATE_WITH_EGRESS
            : ec2.SubnetType.PUBLIC,
        },
        {
          name: 'Db',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });
    this.publicSubnets = this.vpc.selectSubnets({
      subnetGroupName: 'Public',
    });
    this.appSubnets = this.vpc.selectSubnets({
      subnetGroupName: 'App',
    });
    this.dbSubnets = this.vpc.selectSubnets({
      subnetGroupName: 'Db',
    });
  }
}
