// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IRentablePixel.sol";
import "../libraries/DateTime.sol";
import "../libraries/LibAppStorage.sol";
import "../libraries/LibRent.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibERC721.sol";

contract RentFacet is IRentablePixel, ReentrancyGuard {
    AppStorage internal s;

    function listRenting(uint256[] memory pixelIds, uint256 dailyPrice, RentTimeInput memory startTime, RentTimeInput memory endTime, uint16 minDaysToRent,
        uint16 maxDaysToRent, uint16 minDaysBeforeRentCancel, uint16 weeklyDiscount, uint16 monthlyDiscount, uint16 yearlyDiscount) external override{
        require(s.isRentStarted == 1, "1");//"Rent has not started"
        require(pixelIds.length > 0, "2");//"No Pixel is given"
        require(dailyPrice > 1000000, "3");//"Price is too low"
        require(minDaysToRent > 0 && minDaysToRent < s.limitMinDaysToRent && maxDaysToRent > 0 && maxDaysToRent < s.limitMaxDaysToRent && minDaysBeforeRentCancel < s.limitMinDaysBeforeRentCancel, "4");//"Rent Day Params are wrong"
        require(weeklyDiscount < 1000 && monthlyDiscount < 1000 && yearlyDiscount < 1000, "5");//"Discount is high"
        uint256 startTimestampDay; uint256 endTimestampDay;
        (startTimestampDay, endTimestampDay) = LibRent.checkTimeInputs(startTime, endTime);
        require(endTimestampDay - startTimestampDay > AppConstants.dayInSeconds && endTimestampDay - startTimestampDay < AppConstants.dayInSeconds * s.limitMaxDaysForRent && endTimestampDay - block.timestamp < AppConstants.dayInSeconds * s.limitMaxDaysForRent, "6");//"Time values are wrong"

        for (uint256 i = 0; i < pixelIds.length ; i++) {
            uint256 index = pixelIds[i];
            require(LibERC721._ownerOf(index) == LibMeta.msgSender(), "7");//"Only owners can list renting"
            IRentablePixel.RentData[] storage rentData = s.RentStorage[index];
            for (uint256 j = 0; j < rentData.length ; j++) {
                require(startTimestampDay >= rentData[j].endTimestamp || endTimestampDay <= rentData[j].startTimestamp, "8");//"There is already rent defined"
            }
        }

        for (uint256 i = 0; i < pixelIds.length ; i++) {
            uint256 index = pixelIds[i];
            RentData memory newRentData;
            newRentData.tenant = address(0);
            newRentData.dailyPrice = dailyPrice;
            newRentData.startTimestamp = startTimestampDay;
            newRentData.endTimestamp = endTimestampDay;
            newRentData.minDaysToRent = minDaysToRent;
            newRentData.maxDaysToRent = maxDaysToRent;
            newRentData.minDaysBeforeRentCancel = minDaysBeforeRentCancel;
            newRentData.weeklyDiscount = weeklyDiscount;
            newRentData.monthlyDiscount = monthlyDiscount;
            newRentData.yearlyDiscount = yearlyDiscount;
            s.RentStorage[index].push(newRentData);
            emit RentListing(index, startTimestampDay, endTimestampDay);
        }
    }

    function cancelRentListing(uint256[] memory pixelIds, RentTimeInput memory startTime, RentTimeInput memory endTime) external override{
        require(s.isRentStarted == 1, "1");//"Rent has not started"
        require(pixelIds.length > 0, "2");//"No Pixel is given"
        for (uint256 i = 0; i < pixelIds.length ; i++) {
            require(LibERC721._ownerOf(pixelIds[i]) == msg.sender, "3");//"Only owners can cancel renting"
        }
        uint256 startTimestampDay; uint256 endTimestampDay;
        (startTimestampDay, endTimestampDay) = LibRent.checkTimeInputs(startTime, endTime);
        uint256 isCancelled = 0;
        for (uint256 i = 0; i < pixelIds.length ; i++) {
            uint256 index = pixelIds[i];
            RentData[] storage rentData = s.RentStorage[index];
            if(rentData.length > 0){
                for (uint256 j = rentData.length - 1; j >= 0 ; j--) {
                    if(startTime.year == 1970 || endTime.year == 1970){
                        if(rentData[j].tenant == address(0)){
                            rentData[j] = rentData[rentData.length - 1];
                            rentData.pop();
                            emit CancelRent(index, 0, 0);
                            isCancelled++;
                        }
                    }else{
                        if(startTimestampDay == rentData[j].startTimestamp && endTimestampDay == rentData[j].endTimestamp){
                            require(rentData[j].tenant == address(0), "4");//"Tenant is already agreed"
                            rentData[j] = rentData[rentData.length - 1];
                            rentData.pop();
                            isCancelled++;
                            emit CancelRent(index, startTimestampDay, endTimestampDay);
                            break;
                        }
                    }
                }
            }
        }
        require(isCancelled > 0, "5");//"Nothing to cancel"
    }

    function rentPixels(uint256[] memory pixelIds, RentTimeInput memory startTime, RentTimeInput memory endTime) external override payable nonReentrant{
        require(s.isRentStarted == 1, "1");//"Rent has not started"
        uint256 startTimestampDay; uint256 endTimestampDay;
        (startTimestampDay, endTimestampDay) = LibRent.checkTimeInputs(startTime, endTime);
        require(startTimestampDay > block.timestamp, "2");//"Cannot rent past"

        uint256 totalValue;
        for (uint256 i = 0; i < pixelIds.length ; i++) {
            uint256 isFound = 0;
            uint256 index = pixelIds[i];
            IRentablePixel.RentData[] storage rentData = s.RentStorage[index];
            if(rentData.length > 0){
                for (uint256 j = rentData.length - 1; j >= 0 ; j--) {
                    if(startTimestampDay >= rentData[j].startTimestamp && endTimestampDay <= rentData[j].endTimestamp){
                        require(rentData[j].tenant == address(0), "3");//"Tenant is already agreed"
                        uint256 dayDifference = LibRent.toDayDifference(startTimestampDay, endTimestampDay);
                        require(rentData[j].minDaysToRent <= dayDifference, "4");//"Min days to rent is higher"
                        require(rentData[j].maxDaysToRent >= dayDifference, "5");//"Max days to rent is lower"
                        uint256 cost = LibRent.calculateRentCost(rentData[j], startTimestampDay, endTimestampDay);
                        totalValue += cost;
                        s.totalLockedValueByAddress[msg.sender] += cost;

                        if(startTimestampDay == rentData[j].startTimestamp && endTimestampDay == rentData[j].endTimestamp){
                            rentData[j].tenant = msg.sender;
                        }else{
                            rentData[j].tenant = msg.sender;
                            rentData[j].startTimestamp = startTimestampDay;
                            rentData[j].endTimestamp = endTimestampDay;
                            if(startTimestampDay != rentData[j].startTimestamp){
                                s.RentStorage[index].push(RentData(address(0),  rentData[j].dailyPrice, rentData[j].startTimestamp, startTimestampDay,
                                    rentData[j].minDaysToRent,  rentData[j].maxDaysToRent, rentData[j].minDaysBeforeRentCancel,  rentData[j].weeklyDiscount,  rentData[j].monthlyDiscount,  rentData[j].yearlyDiscount, 0));
                            }
                            if(endTimestampDay != rentData[j].endTimestamp){
                                s.RentStorage[index].push(RentData(address(0),  rentData[j].dailyPrice, endTimestampDay, rentData[j].endTimestamp,
                                    rentData[j].minDaysToRent,  rentData[j].maxDaysToRent, rentData[j].minDaysBeforeRentCancel,  rentData[j].weeklyDiscount,  rentData[j].monthlyDiscount,  rentData[j].yearlyDiscount, 0));
                            }
                        }
                        emit Rent(index, startTimestampDay, endTimestampDay, cost);
                        isFound = 1;
                        break;
                    }
                }
            }
            require(isFound > 0, "6");//"No possible rent option"
        }
        require(totalValue <= msg.value, "7");//"AVAX value sent is too low"
        s.totalLockedValue += totalValue;
    }

    function cancelRent(uint256[] memory pixelIds, RentTimeInput memory startTime, RentTimeInput memory endTime) external override nonReentrant{
        require(s.isRentStarted == 1, "1");//"Rent has not started"
        uint256 startTimestampDay; uint256 endTimestampDay;
        (startTimestampDay, endTimestampDay) = LibRent.checkTimeInputs(startTime, endTime);
        DateTime._DateTime memory _now = DateTime.parseTimestamp(block.timestamp);
        uint256 nowTimestampDay = AppConstants.isTestMode == 1 ? block.timestamp : DateTime.toTimestamp(_now.year, _now.month, _now.day);
        require(startTimestampDay > nowTimestampDay, "2");//"Cannot cancel past"

        for (uint256 i = 0; i < pixelIds.length ; i++) {
            uint256 isFound = 0;
            uint256 index = pixelIds[i];
            IRentablePixel.RentData[] storage rentData = s.RentStorage[index];
            for (uint256 j = rentData.length - 1; j >= 0 ; j--) {
                if(rentData[j].tenant == LibMeta.msgSender() && startTimestampDay == rentData[j].startTimestamp && endTimestampDay == rentData[j].endTimestamp){
                    uint256 dayDifference = LibRent.toDayDifference(nowTimestampDay, startTimestampDay);
                    require(rentData[j].minDaysBeforeRentCancel <= dayDifference, "3");//"Rent is not cancellable"
                    isFound = 1;
                    uint256 cost = LibRent.calculateRentCost(rentData[j], rentData[j].startTimestamp, rentData[j].endTimestamp);
                    require(s.totalLockedValueByAddress[LibMeta.msgSender()] >= cost, "4");//"Rent is not refundable"
                    require(s.totalLockedValue >= cost, "5");//"Total locked value issue"
                    s.totalLockedValueByAddress[LibMeta.msgSender()] -= cost;
                    s.totalLockedValue -= cost;
                    rentData[j].tenant = address(0);
                    payable(address(LibMeta.msgSender())).transfer(cost);
                    emit CancelRent(index, startTimestampDay, endTimestampDay);
                    break;
                }
            }
            require(isFound > 0, "6");//"No possible rent option"
        }
    }
}
