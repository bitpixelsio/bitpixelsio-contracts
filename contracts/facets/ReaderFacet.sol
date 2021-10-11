// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/LibAppStorage.sol";
import "../interfaces/IRentablePixel.sol";
import "../libraries/DateTime.sol";
import "../libraries/LibRent.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibERC721.sol";
import { LibDiamond } from "../libraries/LibDiamond.sol";
import { IERC173 } from "../interfaces/IERC173.sol";

contract ReaderFacet is IERC173 {
    AppStorage internal s;

    function init() external {
        s.feeReceiver = payable(LibDiamond.contractOwner());
        s.feePercentage = 150;
        s.baseUri = AppConstants.isTestMode != 1 ? "https://bitpixels.io/token/" : "https://bitpixels-test.web.app/token/";
        s._name = "Bitpixels for Avax";
        s._symbol = "BITPIXELS";
        s.limitMinDaysToRent = 30;
        s.limitMaxDaysToRent = 30;
        s.limitMinDaysBeforeRentCancel = 10;
        s.limitMaxDaysForRent = 90;
    }


    function getRentData(uint256 pixelId) public view returns(IRentablePixel.RentData[] memory){
        return s.RentStorage[pixelId];
    }

    function getTotalLockedValue() public view returns(uint256){
        return s.totalLockedValue;
    }

    function getTotalLockedValueByAddress(address _addr) public view returns(uint256){
        return s.totalLockedValueByAddress[_addr];
    }

    function getSaleStarted() public view returns(uint256){
        return s.isSaleStarted;
    }

    function getRentStarted() public view returns(uint256){
        return s.isRentStarted;
    }

    function getMarketStarted() public view returns(uint256){
        return s.isMarketStarted;
    }

    function flipSale() public {
        LibDiamond.enforceIsContractOwner();
        s.isSaleStarted = 1 - s.isSaleStarted;
    }

    function flipMarket() public {
        LibDiamond.enforceIsContractOwner();
        s.isMarketStarted = 1 - s.isMarketStarted;
    }

    function flipRent() public {
        LibDiamond.enforceIsContractOwner();
        s.isRentStarted = 1 - s.isRentStarted;
    }

    function getMinDaysToRent() public view returns(uint256){
        return s.limitMinDaysToRent;
    }

    function setMinDaysToRent(uint32 value) public {
        LibDiamond.enforceIsContractOwner();
        s.limitMinDaysToRent = value;
    }

    function getMaxDaysToRent() public view returns(uint256){
        return s.limitMaxDaysToRent;
    }

    function setMaxDaysToRent(uint32 value) public {
        LibDiamond.enforceIsContractOwner();
        s.limitMaxDaysToRent = value;
    }

    function getMinDaysBeforeRentCancel() public view returns(uint256){
        return s.limitMinDaysBeforeRentCancel;
    }

    function setMinDaysBeforeRentCancel(uint32 value) public {
        LibDiamond.enforceIsContractOwner();
        s.limitMinDaysBeforeRentCancel = value;
    }

    function getMaxDaysForRent() public view returns(uint256){
        return s.limitMaxDaysForRent;
    }

    function setMaxDaysForRent(uint32 value) public {
        LibDiamond.enforceIsContractOwner();
        s.limitMaxDaysForRent = value;
    }

    function claimableRent() external view returns(uint256){
        require(s.isRentStarted == 1, "Rent has not started");
        DateTime._DateTime memory _now = DateTime.parseTimestamp(block.timestamp);
        uint256 nowTimestampDay = AppConstants.isTestMode == 1 ? block.timestamp : DateTime.toTimestamp(_now.year, _now.month, _now.day);
        uint256 rentTotal;
        uint256[] memory pixelIds = LibERC721._tokensOfOwner(LibMeta.msgSender());
        for (uint256 i = 0; i < pixelIds.length ; i++) {
            uint256 index = pixelIds[i];
            IRentablePixel.RentData[] storage rentData = s.RentStorage[index];
            for (uint256 j = 0; j < rentData.length ; j++) {
                if(nowTimestampDay > rentData[j].startTimestamp && rentData[j].tenant != address(0)){
                    uint256 maxTimeStamp = nowTimestampDay;
                    if(nowTimestampDay > rentData[j].endTimestamp){
                        maxTimeStamp = rentData[j].endTimestamp;
                    }
                    uint256 dayDifference = LibRent.toDayDifference(rentData[j].startTimestamp, maxTimeStamp) - rentData[j].rentCollectedDays;
                    if(dayDifference > 0){
                        uint256 cost = LibRent.calculateRentCost(rentData[j], rentData[j].startTimestamp, rentData[j].endTimestamp);
                        rentTotal += cost * dayDifference / LibRent.toDayDifference(rentData[j].startTimestamp, rentData[j].endTimestamp);
                    }
                }
            }
        }
        return rentTotal;
    }

    function transferOwnership(address _newOwner) external override {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.setContractOwner(_newOwner);
    }

    function owner() external override view returns (address owner_) {
        owner_ = LibDiamond.contractOwner();
    }
}
