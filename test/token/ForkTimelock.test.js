const { latestTime } = require('openzeppelin-solidity/test/helpers/latestTime');
const { duration } = require('openzeppelin-solidity/test/helpers/increaseTime');
const { advanceBlock } = require('openzeppelin-solidity/test/helpers/advanceToBlock');

const { shouldBehaveLikeTokenTimelock } = require('./ERC20/TokenTimelock.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');
const ForkTimelock = artifacts.require('ForkTimelock');

contract('ForkTimelock', function ([owner, beneficiary]) {
  const _name = 'GastroAdvisorToken';
  const _symbol = 'FORK';
  const _decimals = 18;
  const _cap = (new BigNumber(10000)).mul(Math.pow(10, _decimals));

  const amount = new BigNumber(100);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.lockedUntil = (await latestTime()) + duration.weeks(1);

    this.token = await GastroAdvisorToken.new(
      _name,
      _symbol,
      _decimals,
      _cap,
      this.lockedUntil,
      { from: owner }
    );

    this.releaseTime = (await latestTime()) + duration.years(1);
    this.timelock = await ForkTimelock.new(this.token.address, beneficiary, this.releaseTime);

    await this.token.addMinter(owner, { from: owner });
    await this.token.mint(this.timelock.address, amount, { from: owner });
    await this.token.finishMinting({ from: owner });
  });

  context('like a TokenTimelock', function () {
    shouldBehaveLikeTokenTimelock([owner, beneficiary]);
  });
});
