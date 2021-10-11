import { ethers } from "hardhat";
import { Contract } from "ethers";
const { deployDiamond } = require('../scripts/deploy.js')

const addressesFuji = {
  diamondCutFacet: '0xDa12736d125E9FD8a13e37Fa9Babb355B046c52b',
  diamond: '0x0Fb3dB4BD0A76837BA33399B23546625bc2E98f2',
  diamondInit: '0xc5f4D22A00b33FaAFCD21Ff720a8eD6605dE1216',
  DiamondLoupeFacet: '0x9c183Dc7e8ca0d65552cB34Bd2a6febBe6Df6cF2',
  BitpixelsD2Facet: '0x14B5571Db7D7cc8aFC1E3DFB5416edBf69081BcC',
  RentFacet: '0x04f2F9C93502505BE0b4b8C26004b9Bc74abD019',
  ReaderFacet: '0xadA6B429deFBFF15ad6aa08DE25a6fF02253f6E6',
  MarketFacet: '0xa9A8c93339a4414511b30acA6FA5ee30ad92101C'
}

let diamond: Contract
let diamondCutFacet: Contract
let diamondLoupeFacet: Contract
let bitpixelsD2Facet: Contract
let rentFacet: Contract
let readerFacet: Contract
let marketFacet: Contract

export enum Networks{
  LOCAL,
  FUJI,
  MAINNET
}

export async function initContracts(){
  const network = await getNetworkType(ethers)
  let diamondAddress;
  if(network == Networks.LOCAL){
    diamondAddress = await deployDiamond()
  }else if(network == Networks.FUJI){
    diamondAddress = addressesFuji.diamond
  }
  diamond = await ethers.getContractAt('Diamond', diamondAddress)
  diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
  diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
  bitpixelsD2Facet = await ethers.getContractAt('BitpixelsD2Facet', diamondAddress)
  rentFacet = await ethers.getContractAt('RentFacet', diamondAddress)
  readerFacet = await ethers.getContractAt('ReaderFacet', diamondAddress)
  marketFacet = await ethers.getContractAt('MarketFacet', diamondAddress)
}

export async function getPrice(ethers){
  if(await getNetworkType(ethers) == Networks.MAINNET){
    return 1
  }else{
    return 0.001
  }
}

export function getDiamondAddress(){
  return getDiamondContract().address;
}

export function getDiamondContract(): Contract{
  return diamond;
}

export function getDiamondCutFacetContract(): Contract{
  return diamondCutFacet;
}

export function getDiamondLoupeFacetContract(): Contract{
  return diamondLoupeFacet;
}

export function getBitpixelsD2FacetContract(): Contract{
  return bitpixelsD2Facet;
}

export function getRentFacetContract(): Contract{
  return rentFacet;
}

export function getReaderFacetContract(): Contract{
  return readerFacet;
}

export function getMarketFacetContract(): Contract{
  return marketFacet;
}

export async function getNetworkType(ethers){
  const chainId = (await ethers.provider.getNetwork()).chainId
  if(chainId == 43112){
    console.log('LOCAL NETWORK')
    return Networks.LOCAL
  }else if(chainId == 43113){
    console.log('FUJI NETWORK')
    return Networks.FUJI
  }else if(chainId == 43114){
    console.log('AVALANCE MAINNET')
    return Networks.MAINNET
  }
  return Networks.LOCAL
}

export function getPixelIds(x, y, width, height){
  const ids = [];
  for(let i = x; i < x + width; i++){
    for(let j = y; j < y + height; j++){
      ids.push(j * 100 + i)
    }
  }
  return ids;
}

export async function generateBlock(ethers, accFrom, accToAddress){
  let tx = {
    to: accToAddress,
    value: ethers.utils.parseEther("0.00001")
  }
  accFrom.sendTransaction(tx)
}

export function sleep(ms){
  return new Promise(resolve=>{
    // @ts-ignore
    setTimeout(resolve,ms)
  })
}

export function dateToInput(date: Date, isTest = true){
  return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), isTest ? date.getUTCHours() : 0, isTest ? date.getUTCMinutes() : 0, isTest ? date.getUTCSeconds() : 0]
}
