pragma solidity ^0.4.24;

import "./DefaultCrowdsale.sol";
import "../utils/Contributions.sol";


contract IncreasingBonusCrowdsale is DefaultCrowdsale {

  uint256[] public bonusRanges;
  uint256[] public bonusValues;

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

  function setBonusRates(
    uint256[] _bonusRanges,
    uint256[] _bonusValues
  )
  public
  onlyOwner
  {
    require(bonusRanges.length == 0 && bonusValues.length == 0);
    require(_bonusRanges.length == _bonusValues.length);

    for (uint256 i = 0; i < (_bonusValues.length - 1); i++) {
      require(_bonusValues[i] > _bonusValues[i + 1]);
      require(_bonusRanges[i] > _bonusRanges[i + 1]);
    }

    bonusRanges = _bonusRanges;
    bonusValues = _bonusValues;
  }

  /**
   * @dev Override to extend the way in which ether is converted to tokens.
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(uint256 _weiAmount)
  internal view returns (uint256)
  {
    uint256 tokens = _weiAmount.mul(rate);

    uint256 bonusPercent = 0;

    for (uint256 i = 0; i < bonusValues.length; i++) {
      if (_weiAmount >= bonusRanges[i]) {
        bonusPercent = bonusValues[i];
        break;
      }
    }

    uint256 bonusAmount = tokens.mul(bonusPercent).div(100);

    return tokens.add(bonusAmount);
  }
}
