pragma solidity ^0.4.24;

import "./DefaultCrowdsale.sol";
import "../utils/Contributions.sol";


contract PostDeliveryCrowdsale is DefaultCrowdsale {

  mapping(address => uint256) public futureBalances;
  address[] public beneficiaryAddresses;

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

  function multiSend(uint256 _start, uint256 _limit) public onlyOwner {
    require(ended());

    for (uint256 i = _start; i < (_start.add(_limit)); i++) {
      address to = beneficiaryAddresses[i];
      uint256 value = futureBalances[to];

      if (value > 0) {
        futureBalances[to] = 0;
        token.transfer(to, value);
      }
    }
  }

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
    super._processPurchase(address(this), _tokenAmount);
    _saveBalances(_beneficiary, _tokenAmount);
  }

  function _saveBalances(
    address _beneficicary,
    uint256 _tokenAmount
  )
  internal
  {
    if (futureBalances[_beneficicary] == 0) {
      beneficiaryAddresses.push(_beneficicary);
    }
    futureBalances[_beneficicary] = futureBalances[_beneficicary].add(_tokenAmount); // solium-disable-line max-len
  }
}
