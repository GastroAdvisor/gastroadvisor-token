const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');

const { shouldBehaveLikeBaseToken } = require('./base/BaseToken.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');

contract('GastroAdvisorToken', function (
  [owner, anotherAccount, minter, recipient, futureMinter, anotherFutureMinter, thirdParty]
) {
  const _name = 'GastroAdvisorToken';
  const _symbol = 'FORK';
  const _decimals = 18;

  beforeEach(async function () {
    this.token = await GastroAdvisorToken.new({ from: owner });
  });

  context('like a BaseToken', function () {
    shouldBehaveLikeBaseToken(
      [owner, anotherAccount, minter, recipient, futureMinter, anotherFutureMinter, thirdParty],
      [_name, _symbol, _decimals]
    );
  });

  context('like a GastroAdvisorToken behaviours', function () {
    const initialBalance = 1000;

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, initialBalance, { from: minter });
    });

    it('should fail transfer before finish minting', async function () {
      await assertRevert(this.token.transfer(owner, initialBalance, { from: owner }));
    });

    it('should fail transferFrom before finish minting', async function () {
      await this.token.approve(anotherAccount, initialBalance, { from: owner });
      await assertRevert(this.token.transferFrom(owner, recipient, initialBalance, { from: anotherAccount }));
    });
  });
});
