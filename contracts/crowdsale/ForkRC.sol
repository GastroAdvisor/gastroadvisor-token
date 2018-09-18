pragma solidity ^0.4.24;

import "./base/IncreasingBonusCrowdsale.sol";


contract ForkRC is IncreasingBonusCrowdsale {

  constructor(
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    uint256 _tokenCap,
    address _token,
    address _contributions
  )
  IncreasingBonusCrowdsale(
    _startTime,
    _endTime,
    _rate,
    _wallet,
    _tokenCap,
    _token,
    _contributions
  )
  public
  {}
}
