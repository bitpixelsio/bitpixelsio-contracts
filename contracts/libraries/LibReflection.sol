// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LibAppStorage.sol";
import "./LibERC721.sol";
import "./LibMeta.sol";

library LibReflection {
    function _claimReward(uint256 pixelIndex) internal {
        require(LibERC721._ownerOf(pixelIndex) == LibMeta.msgSender(), "Only owner can claim");
        _claimRewardInternal(pixelIndex);
    }

    function _claimRewardInternal(uint256 pixelIndex) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 balance = _getReflectionBalance(pixelIndex);
        if (balance > 0) {
            s.currentReflectionBalance -= balance;
            s.lastDividendAt[pixelIndex] = s.totalDividend;
            payable(LibERC721._ownerOf(pixelIndex)).transfer(balance);
        }
    }

    function _getReflectionBalance(uint256 pixelIndex) internal view returns (uint256){
        AppStorage storage s = LibAppStorage.diamondStorage();
        return s.totalDividend - s.lastDividendAt[pixelIndex];
    }

    function _splitBalance(uint256 amount) internal returns(uint256) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 reflectionShare = amount * s.feePercentage / 1000 * s.reflectionPercentage / 1000;
        _reflectDividend(reflectionShare);
        return reflectionShare;
    }

    function _reflectDividend(uint256 amount) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        s.currentReflectionBalance += amount;
        s.reflectionBalance = s.reflectionBalance + amount;
        s.totalDividend = s.totalDividend + (amount / s._allTokens.length);
    }
}
