/* global ethers */
/* eslint prefer-const: "off" */
import { getReaderFacetContract, initContracts } from "./util";
const { assert } = require('chai')

async function main () {
  await initContracts()

  await getReaderFacetContract().flipSale()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
