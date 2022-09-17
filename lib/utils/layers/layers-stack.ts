import { Stack, Tags} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import AppProps from '../../../interfaces/props';
import { Runtime, Code, LayerVersion } from 'aws-cdk-lib/aws-lambda';

export class LayersStack extends Stack {
  public readonly awswrangler:LayerVersion;
  public readonly psycopg2:LayerVersion;
  public readonly s3fs:LayerVersion;
  public readonly unzip:LayerVersion

  constructor(scope: Construct, id: string, props: AppProps) {
    super(scope, id, props);
    
    //Layers
    this.psycopg2 = new LayerVersion(this, 'psycopg2', {
      layerVersionName: 'psycopg2',
      compatibleRuntimes: [
        Runtime.PYTHON_3_8
      ],
      code: Code.fromAsset('layers/psycopg2-py38.zip'),
      description: 'Lambda Layer para python 3.8 con Psycopg2',
    });

    this.awswrangler = new LayerVersion(this, 'awswrangler', {
      layerVersionName: 'awswrangler',
      compatibleRuntimes: [
        Runtime.PYTHON_3_8
      ],
      code: Code.fromAsset('layers/awswrangler-layer-2.14.0-py3.8.zip'),
      description: 'Lambda Layer para python 3.8 con AWS Wrangler',
    });

    this.s3fs = new LayerVersion(this, 's3fs', {
      layerVersionName: 's3fs',
      compatibleRuntimes: [
        Runtime.PYTHON_3_8
      ],
      code: Code.fromAsset('layers/s3fs.zip'),
      description: 'Lambda Layer para python 3.8 con AWS s3fs',
    });

    this.unzip = new LayerVersion(this, 'unzip', {
      layerVersionName: 'unzip',
      compatibleRuntimes: [
        Runtime.PYTHON_3_8
      ],
      code: Code.fromAsset('layers/unzip-layer.zip'),
      description: 'Lambda Layer para python 3.8 con AWS unzip',
    });
    
    Tags.of(this).add("Project", props.project);
    Tags.of(this).add("Client", props.client);
    Tags.of(this).add("Environment", "DEV");
    Tags.of(this).add("Author", "csosa");
    Tags.of(this).add("ResourceType", "Lambda");

  }
}
