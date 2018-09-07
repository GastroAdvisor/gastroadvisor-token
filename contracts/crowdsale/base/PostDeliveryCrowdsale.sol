pragma solidity ^0.4.24;

import "./DefaultCrowdsale.sol";

import "../utils/Contributions.sol";


contract PostDeliveryCrowdsale is DefaultCrowdsale {

  constructor(
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    uint256 _tokenCap,
    address _token,
    address _contributions
  )
  DefaultCrowdsale(
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

  /**
   * @dev Extend parent behavior to add contributions log
   * @dev Executed when a purchase has been validated and is ready to be executed.
   * @dev Deliver tokens to the contributions contract.
   * @param _beneficiary Unused
   * @param _tokenAmount Number of tokens to be purchased
   */
  function _processPurchase(
    address _beneficiary,
    uint256 _tokenAmount)
  internal
  {
    super._processPurchase(address(contributions), _tokenAmount);
  }
}
