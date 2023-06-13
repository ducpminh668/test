const { BlobServiceClient } = require('@azure/storage-blob');
const { v1: uuidv1 } = require('uuid');
require('dotenv').config();
var Parser = require('csv-parse');
const fs = require('fs');
const filename = './mappings.csv';
const jszip = require('jszip');
const AdmZip = require('adm-zip');

const initConnection = () => {
  const BLOB_STORAGE_CONNECTION_STRING =
   '';
  const BLOB_STORAGE_CONTAINER_NAME = 'ca-media';
  const blobClientService = BlobServiceClient.fromConnectionString(
    BLOB_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobClientService.getContainerClient(
    BLOB_STORAGE_CONTAINER_NAME
  );
  return { blobClientService, containerClient };
};

const getDataFromCSV = () => {
  const data = [];
  fs.createReadStream(filename)
    .pipe(Parser.parse({ delimiter: ',' }))
    .on('data', (r) => {
      // console.log(r);
      data.push(r);
    })
    .on('end', () => {
      console.log(data);
    });
  return data;
};

const unzipDirectory = async (source, outputDirectory) => {
  const zip = new AdmZip(source);
  return new Promise((resolve, reject) => {
    zip.extractAllToAsync(outputDirectory, true, (error) => {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        console.log(`Extracted to "${outputDirectory}" successfully`);
        resolve();
      }
    });
  });
};

async function main() {
  try {
    console.log('Azure Blob storage v12 - JavaScript quickstart sample');
    const { blobClientService, containerClient } = initConnection();
    //Read CSV file:
    // const data = getDataFromCSV();
    const outputDirectory = './ca-media/143000/';
    // await unzipDirectory('./ca-media/143000_ffffff_1.zip', outputDirectory);
    const data = Buffer.from(outputDirectory, "base64");
    const blockBlobClient = containerClient.getBlockBlobClient("images");
    console.log(blockBlobClient)
    const response = await blobClientService.uploadData(data, {
      blobHTTPHeaders: {
        blobContentType: "application/directory",
      },
    });
    if (response._response.status !== 201) {
      throw new Error(
        `Error uploading document ${blockBlobClient.name} to container ${blockBlobClient.containerName}`
      );
    }
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

main()
  .then(() => console.log('Done'))
  .catch((ex) => console.log(ex.message));
