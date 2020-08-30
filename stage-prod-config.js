var fs = require('fs');

// simple script to dyanamically generate semi-secret keys during pipeline prod build

if (!process.env.PROD_API_KEY) {
  throw new Error("Must set process.env.PROD_API_KEY");
}

if (!process.env.PROD_CLIENT_SECRET) {
  throw new Error("Must set process.env.PROD_CLIENT_SECRET");
}


if (!process.env.PROD_DIM_API_KEY) {
  throw new Error("Must set process.env.PROD_DIM_API_KEY");
}

const writeMe = `export const bungieProd = {
  apiKey: '${process.env.PROD_API_KEY}',
  dimApiKey: '${process.env.PROD_DIM_API_KEY}',
  authUrl: 'https://www.bungie.net/en/OAuth/Authorize',
  clientId: '21084',
  clientSecret: '${process.env.PROD_CLIENT_SECRET}'
};
`;

const targetPath = `./src/environments/keys-prod.ts`;
fs.writeFile(targetPath, writeMe, function (err) {
    if (err) {
      console.log(err);
    }
    console.log(`Output generated at ${targetPath}`);
  });
