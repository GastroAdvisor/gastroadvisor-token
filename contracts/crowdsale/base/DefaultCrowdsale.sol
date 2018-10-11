pragma solidity ^0.4.24;

import "eth-token-recover/contracts/TokenRecover.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol"; // solium-disable-line max-len
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol"; // solium-disable-line max-len
import "./TokenCappedCrowdsale.sol";
import "../utils/Contributions.sol";


contract DefaultCrowdsale is TimedCrowdsale, MintedCrowdsale, TokenCappedCrowdsale, TokenRecover { // solium-disable-line max-len

  Contributions public contributions;

  uint256 public minimumContribution;
  uint256 public transactionCount;

  constructor(
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    uint256 _tokenCap,
    uint256 _minimumContribution,
    address _token,
    address _contributions
  )
  Crowdsale(_rate, _wallet, ERC20(_token))
  TimedCrowdsale(_startTime, _endTime)
  TokenCappedCrowdsale(_tokenCap)
  public
  {
    require(_contributions != address(0));
    contributions = Contributions(_contributions);
    minimumContribution = _minimumContribution;
  }

  // false if the ico is not started, true if the ico is started and running, true if the ico is completed
  function started() public view returns(bool) {
    // solium-disable-next-line security/no-block-members
    return block.timestamp >= openingTime;
  }

  // false if the ico is not started, false if the ico is started and running, true if the ico is completed
  function ended() public view returns(bool) {
    return hasClosed() || tokenCapReached();
  }


  /**
   * @dev Extend parent behavior requiring purchase to respect the minimumContribution.
   * @param _beneficiary Token purchaser
   * @param _weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(
    address _beneficiary,
    uint256 _weiAmount
  )
  internal
  {
    require(_weiAmount >= minimumContribution);
    super._preValidatePurchase(_beneficiary, _weiAmount);
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
    contributions.addBalance(
      _beneficiary,
      _weiAmount,
      _getTokenAmount(_weiAmount)
    );

    transactionCount = transactionCount + 1;
  }
}
