pragma solidity ^0.4.24;

import "./base/DefaultToken.sol";


contract GastroAdvisorToken is DefaultToken {

  modifier canTransfer() {
    require(mintingFinished);
    _;
  }

  constructor()
  DefaultToken("GastroAdvisorToken", "FORK", 18)
  public
  {}
}
