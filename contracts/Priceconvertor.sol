// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library Priceconvertor {
    function getprice(
        AggregatorV3Interface s_pricefeed
    ) internal view returns (uint256) {
        (, int answer, , , ) = s_pricefeed.latestRoundData();
        return uint256(answer * 1e10);
    }

    function getconversionRate(
        uint256 ethamount,
        AggregatorV3Interface s_pricefeed
    ) internal view returns (uint256) {
        uint ethprice = getprice(s_pricefeed);
        uint256 ethAmountinUsd = (ethprice * ethamount) / 1e18; //1e18 = 1000000000000000000 wei = 1 eth
        return ethAmountinUsd;
    }
}
