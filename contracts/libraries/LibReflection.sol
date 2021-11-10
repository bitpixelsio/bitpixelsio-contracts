// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LibAppStorage.sol";
import "./LibDiamond.sol";
import "./LibERC721.sol";
import "./LibMeta.sol";

library LibReflection {
    function _claimRewardInternal(uint256 pixelIndex, uint256 mode) internal returns(uint256) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 balance = _getReflectionBalance(pixelIndex);
        if (balance > 0) {
            s.lastDividendAt[pixelIndex] = s.totalDividend;
            if(mode == 0){
                s.currentReflectionBalance -= balance;
                payable(LibERC721._ownerOf(pixelIndex)).transfer(balance);
            }
        }
        return balance;
    }

    function _getReflectionBalance(uint256 pixelIndex) internal view returns (uint256){
        AppStorage storage s = LibAppStorage.diamondStorage();
        if(LibERC721._ownerOf(pixelIndex) == LibDiamond.contractOwner()){
            return 0;
        }
        return s.totalDividend - s.lastDividendAt[pixelIndex];
    }

    function _reflectDividend(uint256 fee) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 reflection = fee * s.reflectionPercentage / 1000;
        s.currentReflectionBalance += reflection;
        s.reflectionBalance = s.reflectionBalance + reflection;
        s.totalDividend = s.totalDividend + (reflection / (s._allTokens.length - s._balances[LibDiamond.contractOwner()]));
        s.creatorBalance += fee - reflection;
    }
}
