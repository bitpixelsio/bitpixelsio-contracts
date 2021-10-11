// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LibAppStorage.sol";
import "../interfaces/IMarketPlace.sol";

library LibMarket {
    function _cancelSale(uint256 tokenId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        delete s.Market[tokenId].price;
        s.Market[tokenId].state = IMarketPlace.TokenState.Neutral;
    }

    function serviceFee(uint256 amount) internal view returns (uint256) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 toFeeReceiver = amount * s.feePercentage;
        return toFeeReceiver / 1000;
    }
}
