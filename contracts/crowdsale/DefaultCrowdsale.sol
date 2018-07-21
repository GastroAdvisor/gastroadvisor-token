pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "./TokenCappedCrowdsale.sol";

import "../Contributions.sol";


contract DefaultCrowdsale is TimedCrowdsale, TokenCappedCrowdsale, MintedCrowdsale, Ownable {

  Contributions public contributions;

  constructor(
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    uint256 _tokenCap,
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

  // it's a safe function allowing to recover any ERC20 sent into the contract for error
  function transferAnyERC20Token(address _tokenAddress, uint256 _tokens) onlyOwner public returns (bool success) {
    return ERC20Basic(_tokenAddress).transfer(owner, _tokens);
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
    contributions.addBalance(_beneficiary, _weiAmount, _getTokenAmount(_weiAmount));
  }

  /**
   * @dev Extend parent behavior to add contributions log
   * @dev Executed when a purchase has been validated and is ready to be executed.
   * @dev Deliver tokens to the contributions contract.
   * @param _beneficiary Unused
   * @param _tokenAmount Number of tokens to be purchased
   */
  function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
    super._deliverTokens(address(contributions), _tokenAmount);
  }
}
