// SPDX-License-Identifier: MIT
//pragma statement

pragma solidity ^0.8.28;
//imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./Priceconvertor.sol";
//error codes

error Fundme__NotOwner();
error callfailed();
error NotenoughUSD();

// Interfaces,Libraries,Contracts

/**
 * @title A contract for crowd funcding
 * @author Wasim Choudhary
 * @notice This contract is to demo a sample funding contract
 * @dev This implements price feed as our library
 */

contract Fundme {
    //inside contract follow the style from //

    //Type declarations

    using Priceconvertor for uint256;

    //state variables
    uint256 public constant MINIMUM_USD = 50 * 1e18;
    address[] private s_senders;
    mapping(address => uint256) private s_addresstoamountsent;
    address private immutable i_owner;
    AggregatorV3Interface private s_pricefeed;

    //modifiers

    modifier onlyowner() {
        //require(msg.sender == i_owner, "You are not the owner."); // require uses for gas
        if (msg.sender != i_owner) {
            revert Fundme__NotOwner();
        }
        _;
    }

    //functions order:
    //// constructor
    //// receive
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view / pure

    constructor(address pricefeedAddress) {
        i_owner = msg.sender;
        s_pricefeed = AggregatorV3Interface(pricefeedAddress);
    }

    receive() external payable {
        sendfund();
    }

    fallback() external payable {
        sendfund();
    }

    function sendfund() public payable {
        //want tp able t set a minimum func amount in USD
        // 1. hOW do we sent eth to this contract
        //require(msg.value.getconversionRate() >=  MINIMUM_USD,"Didn't send enough currency");// MORE GAS
        if (msg.value.getconversionRate(s_pricefeed) < MINIMUM_USD) {
            revert NotenoughUSD();
        }

        s_addresstoamountsent[msg.sender] += msg.value;
        s_senders.push(msg.sender);
    }

    function withdrawfund() public onlyowner {
        for (
            uint256 senderIndex = 0;
            s_senders.length > senderIndex;
            senderIndex++
        ) {
            address sender = s_senders[senderIndex];
            s_addresstoamountsent[sender] = 0;
        }
        s_senders = new address[](0);
        (bool callsuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        //require(callsuccess,"call failed");
        if (!callsuccess) {
            revert callfailed();
        }
    }

    function cheaperwithdraw() public payable onlyowner {
        address[] memory funders = s_senders;
        //maping cant be in memory
        for (
            uint256 senderIndex = 0;
            senderIndex < funders.length;
            senderIndex++
        ) {
            address funder = funders[senderIndex];
            s_addresstoamountsent[funder] = 0;
        }
        s_senders = new address[](0);
        (bool callsuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        if (!callsuccess) {
            revert callfailed();
        }
    }

    //view/pure

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getSender(uint256 index) public view returns (address) {
        return s_senders[index];
    }

    function getAddresstoAmountsent(
        address sender
    ) public view returns (uint256) {
        return s_addresstoamountsent[sender];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_pricefeed;
    }
}
