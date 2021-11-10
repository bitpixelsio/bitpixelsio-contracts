// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LibAppStorage.sol";
import "../interfaces/IMarketPlace.sol";

library LibMarket {
    event MarketCancel(uint256 indexed pixelId);

    function _cancelSale(uint256 tokenId, uint256 emitEvent) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        _cancelSaleGroup(s.MarketV2Pixel[tokenId], emitEvent);
    }

    function _cancelSaleGroup(uint256 groupId, uint256 emitEvent) internal {
        if(groupId != 0){
            AppStorage storage s = LibAppStorage.diamondStorage();
            uint256[] memory groupPixels = s.MarketV2[groupId].pixels;
            for(uint256 j = 0; j < groupPixels.length; j++){
                s.MarketV2Pixel[groupPixels[j]] = 0;
                if(emitEvent > 0){
                    emit MarketCancel(groupPixels[j]);
                }
            }
            delete s.MarketV2[groupId].pixels;
            s.MarketV2[groupId].totalPrice = 0;
        }
    }

    function serviceFee(uint256 amount) internal view returns (uint256) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 toFeeReceiver = amount * s.feePercentage;
        return toFeeReceiver / 1000;
    }
}
