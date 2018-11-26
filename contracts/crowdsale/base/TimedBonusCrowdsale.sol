pragma solidity ^0.4.24;

import "./DefaultCrowdsale.sol";
import "../utils/Contributions.sol";


/**
 * @title TimedBonusCrowdsale
 * @author Vittorio Minacori (https://github.com/vittominacori)
 * @dev Extension of DefaultCrowdsale contract whose bonus decrease in time.
 */
contract TimedBonusCrowdsale is DefaultCrowdsale {

  uint256[] public bonusDates;
  uint256[] public bonusRates;

  function setBonusRates(
    uint256[] _bonusDates,
    uint256[] _bonusRates
  )
  external
  onlyOwner
  {
    require(!started());
    require(_bonusDates.length == 2);
    require(_bonusRates.length == 2);
    require(_bonusDates[0] < _bonusDates[1]);

    bonusDates = _bonusDates;
    bonusRates = _bonusRates;
  }

  /**
   * @dev Override to extend the way in which ether is converted to tokens.
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(
    uint256 _weiAmount
  )
  internal
  view
  returns (uint256)
  {
    uint256 bonusAmount = 0;
    uint256 tokenAmount = super._getTokenAmount(_weiAmount);

    if (bonusDates.length > 0) {
      uint256 bonusPercent = 0;

      // solium-disable-next-line security/no-block-members
      if (block.timestamp < bonusDates[0]) {
        bonusPercent = bonusRates[0];
      } else if (block.timestamp < bonusDates[1]) { // solium-disable-line security/no-block-members
        bonusPercent = bonusRates[1];
      }

      if (bonusPercent > 0) {
        bonusAmount = tokenAmount.mul(bonusPercent).div(100);
      }
    }

    return tokenAmount.add(bonusAmount);
  }
}
