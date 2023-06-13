const fs = require('fs-extra');
const axios = require('axios');
const { BlobServiceClient } = require('@azure/storage-blob');
const AdmZip = require('adm-zip');
const CSVToJSON = require('csvtojson');
const filename = './mappings.csv';

const connectionString =
  '';
const containerName = 'ca-media';

async function downloadAndUploadImage(url, imgId, color, shadow) {
  const tempFolderPath = './temp';

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const folderPath = `images/${imgId}/${color}/${shadow}`;

  const tempFilePath = `${tempFolderPath}/${imgId}.zip`;

  const response = await axios.get(url, { responseType: 'arraybuffer' });

  await fs.ensureDir(tempFolderPath);
  console.log(tempFolderPath);
  await fs.writeFile(tempFilePath, response.data);

  const zip = new AdmZip(tempFilePath);
  const zipEntries = zip.getEntries();

  for (const zipEntry of zipEntries) {
    if (!zipEntry.isDirectory) {
      const fileName = zipEntry.entryName;
      const fileContent = zipEntry.getData();

      const blobName = `${folderPath}/${fileName}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(fileContent, fileContent.length);
      console.log(`Uploaded ${fileName} to Azure Blob Storage in ${blobName}.`);
    }
  }

  await fs.remove(tempFilePath);

  console.log('Download and upload completed.');
}

function main() {
  CSVToJSON()
    .fromFile(filename)
    .then((data) => {
      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        console.log(
          '3333333',
          element.IMAGE_ID,
          element.DEF_HEX,
          element.SHADOW
        );
        if (
          element.IMAGE_ID !== '' &&
          element.DEF_HEX !== '' &&
          element.SHADOW !== ''
        ) {
          const HEX =
            element.DEF_HEX.toString().length < 6
              ? Array(6 - element.DEF_HEX.toString().length)
                  .fill(0)
                  .join('')
              : element.DEF_HEX;
          const imageUrl = `https://img1.imaca.de/output/downloadimg.php?imgid=${element.IMAGE_ID}&color=${element.DEF_HEX}&shadow=${element.SHADOW}&clientid=76-7cc8c95bd83160aab122990635f1b384-06122022`;
          downloadAndUploadImage(
            imageUrl,
            element.IMAGE_ID,
            element.DEF_HEX,
            element.SHADOW
          ).catch((error) => {
            console.error('Error:', error);
          });
        }
      }
    })
    .catch((err) => {
      console.log(err);
    });
}
main();
