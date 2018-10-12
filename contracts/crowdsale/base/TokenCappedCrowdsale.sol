pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";


/**
 * @title TokenCappedCrowdsale
 * @author Vittorio Minacori (https://github.com/vittominacori)
 * @dev Crowdsale with a limited amount of tokens to be sold
 */
contract TokenCappedCrowdsale is Crowdsale {

  using SafeMath for uint256;

  uint256 public tokenCap;

  // Amount of token sold
  uint256 public soldTokens;

  /**
   * @dev Constructor, takes maximum amount of tokens to be sold in the crowdsale.
   * @param _tokenCap Max amount of tokens to be sold
   */
  constructor(uint256 _tokenCap) public {
    require(_tokenCap > 0);
    tokenCap = _tokenCap;
  }

  /**
   * @dev Checks whether the tokenCap has been reached.
   * @return Whether the tokenCap was reached
   */
  function tokenCapReached() public view returns (bool) {
    return soldTokens >= tokenCap;
  }

  /**
   * @dev Extend parent behavior requiring purchase to respect the tokenCap.
   * @param _beneficiary Token purchaser
   * @param _weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(
    address _beneficiary,
    uint256 _weiAmount
  )
  internal
  {
    super._preValidatePurchase(_beneficiary, _weiAmount);
    require(soldTokens.add(_getTokenAmount(_weiAmount)) <= tokenCap);
  }

  /**
   * @dev Update the contributions contract states
   * @param _beneficiary Address receiving the tokens
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _updatePurchasingState(
    address _beneficiary,
    uint256 _weiAmount
  )
  internal
  {
    super._updatePurchasingState(_beneficiary, _weiAmount);
    soldTokens = soldTokens.add(_getTokenAmount(_weiAmount));
  }
}
