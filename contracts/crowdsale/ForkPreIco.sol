pragma solidity ^0.4.24;

import "./base/DefaultCrowdsale.sol";


/**
 * @title ForkPreIco
 * @author Vittorio Minacori (https://github.com/vittominacori)
 * @dev Extends from DefaultCrowdsale
 */
contract ForkPreIco is DefaultCrowdsale {

  constructor(
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    uint256 _tokenCap,
    uint256 _minimumContribution,
    uint256 _maximumContribution,
    address _token,
    address _contributions
  )
  DefaultCrowdsale(
    _startTime,
    _endTime,
    _rate,
    _wallet,
    _tokenCap,
    _minimumContribution,
    _maximumContribution,
    _token,
    _contributions
  )
  public
  {}
}
