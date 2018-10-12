const { shouldBehaveLikeERC1363BasicToken } = require('erc-payable-token/test/token/ERC1363/ERC1363BasicToken.behaviour'); // eslint-disable-line max-len
const { shouldBehaveLikeMintableToken } = require('openzeppelin-solidity/test/token/ERC20/MintableToken.behaviour');
const { shouldBehaveLikeRBACMintableToken } = require('openzeppelin-solidity/test/token/ERC20/RBACMintableToken.behaviour'); // eslint-disable-line max-len
const { shouldBehaveLikeBurnableToken } = require('openzeppelin-solidity/test/token/ERC20/BurnableToken.behaviour');
const { shouldBehaveLikeTokenRecover } = require('eth-token-recover/test/TokenRecover.behaviour');

const { shouldBehaveLikeDetailedERC20Token } = require('../ERC20/DetailedERC20.behaviour');
const { shouldBehaveLikeStandardToken } = require('../ERC20/StandardToken.behaviour');
const { shouldBehaveLikeRBAC } = require('../../access/RBAC.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeBaseToken (
  [owner, anotherAccount, minter, recipient, futureMinter, anotherFutureMinter, thirdParty],
  [_name, _symbol, _decimals]
) {
  context('like a DetailedERC20 token', function () {
    shouldBehaveLikeDetailedERC20Token(_name, _symbol, _decimals);
  });

  context('like a MintableToken', function () {
    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
    });
    shouldBehaveLikeMintableToken([owner, anotherAccount, minter]);
  });

  context('like a RBACMintableToken', function () {
    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
    });
    shouldBehaveLikeRBACMintableToken([owner, anotherAccount, minter]);
  });

  context('like a BurnableToken', function () {
    const initialBalance = 1000;

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, initialBalance, { from: minter });
    });
    shouldBehaveLikeBurnableToken([owner], initialBalance);
  });

  context('like a StandardToken', function () {
    const initialBalance = 1000;

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, initialBalance, { from: minter });
      await this.token.finishMinting({ from: owner });
    });
    shouldBehaveLikeStandardToken([owner, anotherAccount, recipient], initialBalance);
  });

  context('like a ERC1363BasicToken ', function () {
    const initialBalance = 1000;

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, initialBalance, { from: minter });
    });

    describe('after finishMinting', function () {
      beforeEach(async function () {
        await this.token.finishMinting({ from: owner });
      });

      shouldBehaveLikeERC1363BasicToken([owner, anotherAccount, recipient], initialBalance);
    });
  });

  context('like a RBAC', function () {
    beforeEach(async function () {
      this.instance = this.token;
    });

    shouldBehaveLikeRBAC([owner, minter, futureMinter, anotherFutureMinter, thirdParty]);
  });

  context('like a TokenRecover', function () {
    beforeEach(async function () {
      this.instance = this.token;
    });

    shouldBehaveLikeTokenRecover([owner, thirdParty]);
  });
}

module.exports = {
  shouldBehaveLikeBaseToken,
};
