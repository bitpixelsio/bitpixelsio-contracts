// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface _Bitpixels{
    function addToCommunityRoyalties(uint256 amount) external;
}

contract BitpixelsFeeReceiver is Ownable {
    _Bitpixels private bitpixels;
    address private diamondAddress;
    uint256 public totalReceived;
    uint256 public isEnabled = 0;


    constructor(address _diamondContractAddress) payable {
        bitpixels = _Bitpixels(_diamondContractAddress);
        diamondAddress = _diamondContractAddress;
    }

    function flipControl() public onlyOwner {
        isEnabled = 1 - isEnabled;
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function withdrawAmount(uint amount) public onlyOwner{
        payable(msg.sender).transfer(amount);
    }

    function withdrawToContract() public onlyOwner {
        payable(diamondAddress).transfer(address(this).balance);
    }

    function withdrawAmountToContract(uint amount) public onlyOwner{
        payable(diamondAddress).transfer(amount);
    }


    fallback () external payable {}
    receive () external payable {
        if(isEnabled == 1){
            totalReceived += msg.value;
            bitpixels.addToCommunityRoyalties(msg.value);
        }
    }


}
