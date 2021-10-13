// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LibAppStorage.sol";
import "./DateTime.sol";
import "./LibMeta.sol";
import "./LibMarket.sol";
import "./LibReflection.sol";
import "./LibERC721.sol";
import "../interfaces/IRentablePixel.sol";

library LibRent {
    function checkTimeInputs(IRentablePixel.RentTimeInput memory startTime, IRentablePixel.RentTimeInput memory endTime) internal pure returns(uint256, uint256){
        if(AppConstants.isTestMode != 1){
            require(startTime.hour == 0 && startTime.minute == 0 && startTime.second == 0 && endTime.hour == 0 && endTime.minute == 0 && endTime.second == 0, "Time input is wrong-1");
        }
        require(startTime.month > 0 && startTime.month <= 12 && startTime.day > 0 && startTime.day < 32 && startTime.hour < 24 && startTime.minute < 60 && startTime.second < 60 &&
        endTime.month > 0 && endTime.month <= 12 && endTime.day > 0 && endTime.day < 32 && endTime.hour < 24 && endTime.minute < 60 && endTime.second < 60, "Time input is wrong");
        uint256 startTimestampDay = DateTime.toTimestamp(startTime.year, startTime.month, startTime.day, startTime.hour, startTime.minute, startTime.second);
        uint256 endTimestampDay = DateTime.toTimestamp(endTime.year, endTime.month, endTime.day, endTime.hour, endTime.minute, endTime.second);
        return (startTimestampDay, endTimestampDay);
    }

    function claimRentCore(address pixelOwner) internal returns(uint256){
        AppStorage storage s = LibAppStorage.diamondStorage();
        DateTime._DateTime memory _now = DateTime.parseTimestamp(block.timestamp);
        uint256 nowTimestampDay = AppConstants.isTestMode == 1 ? block.timestamp : DateTime.toTimestamp(_now.year, _now.month, _now.day);
        uint256 rentTotal;
        uint256[] memory pixelIds = LibERC721._tokensOfOwner(pixelOwner);
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
                        uint256 currentRent = (cost * dayDifference) / LibRent.toDayDifference(rentData[j].startTimestamp, rentData[j].endTimestamp);
                        rentTotal += currentRent;
                        rentData[j].rentCollectedDays += uint16(dayDifference);
                        require(s.totalLockedValueByAddress[rentData[j].tenant] >= currentRent, "Rent is not refundable");
                        s.totalLockedValueByAddress[rentData[j].tenant] -= currentRent;
                    }
                }
            }
        }
        if(rentTotal > 0){
            require(s.totalLockedValue >= rentTotal, "Locked value is low then expected");
            s.totalLockedValue -= rentTotal;
            uint256 reflection = LibReflection._splitBalance(rentTotal);
            uint256 fee = LibMarket.serviceFee(rentTotal);
            payable(pixelOwner).transfer(rentTotal - fee);
            s.feeReceiver.transfer(fee - reflection);
            return rentTotal - fee;
        }
        return 0;
    }

    function calculateRentCost(IRentablePixel.RentData memory data, uint256 startTimestamp, uint256 endTimestamp) internal pure returns(uint256){
        uint256 discount = 0;
        if(endTimestamp - startTimestamp > AppConstants.dayInSeconds * 365){
            discount = data.yearlyDiscount;
        }else if(endTimestamp - startTimestamp > AppConstants.dayInSeconds * 30){
            discount = data.monthlyDiscount;
        }else if(endTimestamp - startTimestamp > AppConstants.dayInSeconds * 7){
            discount = data.weeklyDiscount;
        }
        uint256 dayDifference = (endTimestamp - startTimestamp) / (AppConstants.dayInSeconds);

        return data.dailyPrice * dayDifference * (1000 - discount) / 1000;
    }

    function toDayDifference(uint256 startTimestamp, uint256 endTimestamp) internal pure returns(uint256){
        return (endTimestamp - startTimestamp) / AppConstants.dayInSeconds;
    }
}
