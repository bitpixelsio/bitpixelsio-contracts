// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRentablePixel{
    struct RentData {
        address tenant;
        uint256 dailyPrice;
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint16 minDaysToRent;
        uint16 maxDaysToRent;
        uint16 minDaysBeforeRentCancel;
        uint16 weeklyDiscount;
        uint16 monthlyDiscount;
        uint16 yearlyDiscount;
        uint16 rentCollectedDays;
    }

    struct RentTimeInput {
        uint16 year;
        uint8 month;//1-12
        uint8 day;//1-31
        uint8 hour;//0-23
        uint8 minute;//0-59
        uint8 second;//0-59
    }

    event RentListing(uint256 indexed tokenId, uint256 startTimestamp, uint256 endTimestamp);
    event CancelListing(uint256 indexed tokenId, uint256 startTimestamp, uint256 endTimestamp);
    event Rent(uint256 indexed tokenId, uint256 startTimestamp, uint256 endTimestamp, uint256 price);
    event CancelRent(uint256 indexed tokenId, uint256 startTimestamp, uint256 endTimestamp);

    function listRenting(uint256[] memory pixelIds, uint256 dailyPrice, RentTimeInput memory startTime, RentTimeInput memory endTime, uint16 minDaysToRent,
        uint16 maxDaysToRent, uint16 minDaysBeforeRentCancel, uint16 weeklyDiscount, uint16 monthlyDiscount, uint16 yearlyDiscount) external;
    function cancelRentListing(uint256[] memory pixelIds, RentTimeInput memory startTime, RentTimeInput memory endTime) external;
    function rentPixels(uint256[] memory pixelIds, RentTimeInput memory startTime, RentTimeInput memory endTime) external payable;
    function cancelRent(uint256[] memory pixelIds, RentTimeInput memory startTime, RentTimeInput memory endTime) external;
}
