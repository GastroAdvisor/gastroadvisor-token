pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/access/rbac/RBAC.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title Contributions
 * @author Vittorio Minacori (https://github.com/vittominacori)
 * @dev Utility contract where to save any information about Crowdsales' contributions
 */
contract Contributions is RBAC, Ownable {

  using SafeMath for uint256;

  string public constant ROLE_MINTER = "minter";

  modifier onlyMinter () {
    checkRole(msg.sender, ROLE_MINTER);
    _;
  }

  mapping(address => uint256) public tokenBalances;
  mapping(address => uint256) public ethContributions;
  address[] public addresses;

  constructor() public {}

  function addBalance(
    address _address,
    uint256 _weiAmount,
    uint256 _tokenAmount
  )
  public
  onlyMinter
  {
    if (ethContributions[_address] == 0) {
      addresses.push(_address);
    }
    ethContributions[_address] = ethContributions[_address].add(_weiAmount);
    tokenBalances[_address] = tokenBalances[_address].add(_tokenAmount);
  }

  /**
   * @dev add a minter role to an address
   * @param _minter address
   */
  function addMinter(address _minter) public onlyOwner {
    addRole(_minter, ROLE_MINTER);
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

  /**
   * @dev remove a minter role from an address
   * @param _minter address
   */
  function removeMinter(address _minter) public onlyOwner {
    removeRole(_minter, ROLE_MINTER);
  }

  function getContributorsLength() public view returns (uint) {
    return addresses.length;
  }
}
