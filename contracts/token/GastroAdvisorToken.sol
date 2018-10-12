pragma solidity ^0.4.24;

import "./base/BaseToken.sol";


/**
 * @title GastroAdvisorToken
 * @author Vittorio Minacori (https://github.com/vittominacori)
 * @dev GastroAdvisorToken is an ERC20 token with a lot of stuffs. Extends from BaseToken
 */
contract GastroAdvisorToken is BaseToken {

  uint256 public lockedUntil;
  mapping(address => uint256) lockedBalances;
  string constant ROLE_OPERATOR = "operator";

  /**
   * @dev Tokens can be moved only after minting finished or if you are an approved operator.
   *  Some tokens can be locked until a date. Nobody can move locked tokens before of this date.
   */
  modifier canTransfer(address _from, uint256 _value) {
    require(mintingFinished || hasRole(_from, ROLE_OPERATOR));
    require(_value <= balances[_from].sub(lockedBalanceOf(_from)));
    _;
  }

  constructor(
    string _name,
    string _symbol,
    uint8 _decimals,
    uint256 _lockedUntil
  )
  BaseToken(_name, _symbol, _decimals)
  public
  {
    lockedUntil = _lockedUntil;
  }

  function transfer(
    address _to,
    uint256 _value
  )
  public
  canTransfer(msg.sender, _value)
  returns (bool)
  {
    return super.transfer(_to, _value);
  }

  function transferFrom(
    address _from,
    address _to,
    uint256 _value
  )
  public
  canTransfer(_from, _value)
  returns (bool)
  {
    return super.transferFrom(_from, _to, _value);
  }

  /**
   * @dev Gets the locked balance of the specified address.
   * @param _who The address to query the balance of.
   * @return An uint256 representing the locked amount owned by the passed address.
   */
  function lockedBalanceOf(address _who) public view returns (uint256) {
    // solium-disable-next-line security/no-block-members
    return block.timestamp <= lockedUntil ? lockedBalances[_who] : 0;
  }

  /**
   * @dev Function to mint and lock tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mintAndLock(
    address _to,
    uint256 _amount
  )
  public
  hasMintPermission
  canMint
  returns (bool)
  {
    lockedBalances[_to] = lockedBalances[_to].add(_amount);
    return super.mint(_to, _amount);
  }

  /**
   * @dev add a operator role to an array of addresses
   * @param _operators address[]
   */
  function addOperators(address[] _operators) public onlyOwner {
    require(!mintingFinished);
    require(_operators.length > 0);
    for (uint i = 0; i < _operators.length; i++) {
      addRole(_operators[i], ROLE_OPERATOR);
    }
  }

  /**
   * @dev remove a operator role from an address
   * @param _operator address
   */
  function removeOperator(address _operator) public onlyOwner {
    removeRole(_operator, ROLE_OPERATOR);
  }

  /**
   * @dev add a minter role to an array of addresses
   * @param _minters address[]
   */
  function addMinters(address[] _minters) public onlyOwner {
    require(_minters.length > 0);
    for (uint i = 0; i < _minters.length; i++) {
      addRole(_minters[i], ROLE_MINTER);
    }
  }
}
