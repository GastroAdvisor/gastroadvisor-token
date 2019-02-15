const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');
const { latestTime } = require('openzeppelin-solidity/test/helpers/latestTime');
const { increaseTimeTo, duration } = require('openzeppelin-solidity/test/helpers/increaseTime');
const { advanceBlock } = require('openzeppelin-solidity/test/helpers/advanceToBlock');

const { shouldBehaveLikeGroupTimelock } = require('./ERC20/GroupTimelock.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');
const GroupForkTimelock = artifacts.require('GroupForkTimelock');

contract('GroupForkTimelock', function (accounts) {
  const _name = 'GastroAdvisorToken';
  const _symbol = 'FORK';
  const _decimals = 18;

  let lockedTokens = new BigNumber(0);

  const [
    owner,
    ...receivers
  ] = accounts;

  const amounts = [];
  for (const arrayIndex in receivers) {
    const val = new BigNumber(100 * arrayIndex);

    amounts.push(val);
    lockedTokens = lockedTokens.add(val);
  }

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
      lockedTokens,
      this.lockedUntil,
      { from: owner }
    );

    this.releaseTime = (await latestTime()) + duration.years(1);
  });

  context('creating a valid timelock', function () {
    describe('if release time is in the past', function () {
      it('reverts', async function () {
        const releaseTime = (await latestTime()) - duration.years(1);
        await assertRevert(
          GroupForkTimelock.new(this.token.address, receivers, amounts, releaseTime)
        );
      });
    });

    describe('if addresses are empty', function () {
      it('reverts', async function () {
        await assertRevert(
          GroupForkTimelock.new(this.token.address, [], amounts, this.releaseTime)
        );
      });
    });

    describe('if amounts are empty', function () {
      it('reverts', async function () {
        await assertRevert(
          GroupForkTimelock.new(this.token.address, receivers, [], this.releaseTime)
        );
      });
    });

    describe('if amounts length is not equal to addresses length', function () {
      it('reverts', async function () {
        await assertRevert(
          GroupForkTimelock.new(this.token.address, [receivers[0]], [amounts[0], amounts[1]], this.releaseTime)
        );
      });
    });
  });

  context('testing release', function () {
    describe('if contract has not enough tokens', function () {
      it('reverts', async function () {
        const timelock = await GroupForkTimelock.new(this.token.address, receivers, amounts, this.releaseTime);

        await this.token.addMinter(owner, { from: owner });
        await this.token.mint(timelock.address, lockedTokens.sub(1), { from: owner });
        await this.token.finishMinting({ from: owner });

        await increaseTimeTo(this.releaseTime + duration.seconds(1));
        await timelock.release().should.be.rejected;
      });
    });
  });

  context('like a GroupTimelock', function () {
    beforeEach(async function () {
      this.timelock = await GroupForkTimelock.new(this.token.address, receivers, amounts, this.releaseTime);

      await this.token.addMinter(owner, { from: owner });
      await this.token.mint(this.timelock.address, lockedTokens, { from: owner });
      await this.token.finishMinting({ from: owner });
    });

    shouldBehaveLikeGroupTimelock(owner, receivers, amounts, lockedTokens);
  });
});
