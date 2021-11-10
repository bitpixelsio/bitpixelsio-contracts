/* global ethers */
/* eslint prefer-const: "off" */
import { getBitpixelsD2FacetContract, initContracts } from "./util";

let count = 0

async function main () {
  await initContracts()

  const rects = [
    {x: 11, y: 13, width: 5,  height: 7},
    {x: 16, y: 13, width: 5,  height: 7},
    {x: 10, y: 43, width: 15,  height: 3},
    {x: 10, y: 46, width: 15,  height: 3},
    {x: 14, y: 67, width: 5,  height: 7},
    {x: 14, y: 74, width: 5,  height: 8},
    {x: 3, y: 90, width: 15,  height: 3},
    {x: 3, y: 93, width: 15,  height: 3},
    {x: 32, y: 7, width: 3,  height: 12},
    {x: 35, y: 7, width: 3,  height: 12},
    {x: 89, y: 14, width: 2,  height: 22},
    {x: 91, y: 14, width: 2,  height: 22},
    {x: 93, y: 14, width: 2,  height: 22},
    {x: 26, y: 83, width: 13, height:  3},
    {x: 26, y: 86, width: 13, height:  3},
    {x: 46, y: 83, width: 13, height:  3},
    {x: 46, y: 86, width: 13, height:  3},
    {x: 65, y: 13, width: 4,  height: 7 },
    {x: 69, y: 13, width: 4,  height: 7 },
    {x: 63, y: 53, width: 7,  height: 6 },
    {x: 63, y: 59, width: 7,  height: 6 },
    {x: 82, y: 85, width: 5,  height: 10 },
    {x: 87, y: 85, width: 5,  height: 10 },
    {x: 92, y: 43, width: 5,  height: 5 },
    {x: 92, y: 48, width: 5,  height: 10 }
  ]
  for(let rect of rects){
    await claimOwned(rect.x, rect.y, rect.width, rect.height)
  }
}

async function claimOwned(x: number, y: number, width: number, height: number){
  const gasLimit = 130000
  try{
    await getBitpixelsD2FacetContract().claim(x, y, width, height, {gasLimit: width * height * gasLimit})
    console.log(count++)
  }catch (e) {
    console.log(count++, e)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
