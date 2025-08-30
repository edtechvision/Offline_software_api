const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  endpoint: "blr1.digitaloceanspaces.com", // change this to your region
  accessKeyId: process.env.DO_SPACE_KEY,
  secretAccessKey: process.env.DO_SPACE_SECRET,
});

module.exports = s3;
