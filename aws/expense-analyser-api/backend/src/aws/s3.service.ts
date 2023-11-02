import AWS from 'aws-sdk';
import * as fs from 'fs';

// Configure AWS SDK with your credentials
AWS.config.update({
  accessKeyId: '769729745008',
  secretAccessKey: 'AKIA3GN3X2BYKOWQK36J',
  region: 'eu-central-1', // Replace with your AWS region
});

// Create an S3 instance
const s3 = new AWS.S3();

// Specify the S3 bucket and file key (path) of the CSV file you want to download
const bucketName = 'costs-csv';
const fileKey = 'source.xlsx';

// Specify the local file path where you want to save the downloaded CSV file
const localFilePath = 'source.xlsx';

// Create parameters for the S3 getObject operation
const params = {
  Bucket: bucketName,
  Key: fileKey,
};

// Create a writable stream to save the file locally
const fileStream: fs.WriteStream = fs.createWriteStream(localFilePath);

export async function loadCsv() {
  // Use the S3 getObject method to download the file
  s3.getObject(params)
    .createReadStream()
    .on('error', (err) => {
      console.error('Error downloading file from S3:', err);
    })
    .pipe(fileStream)
    .on('close', () => {
      console.log(`File downloaded to ${localFilePath}`);
    });
}