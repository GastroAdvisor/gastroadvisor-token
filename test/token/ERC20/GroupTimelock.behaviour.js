const { increaseTimeTo, duration } = require('openzeppelin-solidity/test/helpers/increaseTime');

const { shouldBehaveLikeTokenRecover } = require('eth-token-recover/test/TokenRecover.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeGroupTimelock (owner, receivers, amounts, lockedTokens) {
  it('locked tokens should be right set', async function () {
    const setLockedTokens = await this.timelock.lockedTokens();
    setLockedTokens.should.be.bignumber.equal(lockedTokens);
  });

  it('reserved tokens should be right set', async function () {
    for (const arrayIndex in receivers) {
      const reservedTokens = await this.timelock.reservedTokens(receivers[arrayIndex]);
      reservedTokens.should.be.bignumber.equal(amounts[arrayIndex]);
    }
  });

  it('cannot be released before time limit', async function () {
    await this.timelock.release().should.be.rejected;
  });

  it('cannot be released just before time limit', async function () {
    await increaseTimeTo(this.releaseTime - duration.seconds(3));
    await this.timelock.release().should.be.rejected;
  });

  it('can be released just after limit', async function () {
    await increaseTimeTo(this.releaseTime + duration.seconds(1));
    await this.timelock.release().should.be.fulfilled;

    for (const arrayIndex in receivers) {
      const balance = await this.token.balanceOf(receivers[arrayIndex]);
      const receivedTokens = await this.timelock.receivedTokens(receivers[arrayIndex]);

      balance.should.be.bignumber.equal(amounts[arrayIndex]);
      receivedTokens.should.be.bignumber.equal(balance);
    }
  });

  it('can be released after time limit', async function () {
    await increaseTimeTo(this.releaseTime + duration.years(1));
    await this.timelock.release().should.be.fulfilled;

    for (const arrayIndex in receivers) {
      const balance = await this.token.balanceOf(receivers[arrayIndex]);
      const receivedTokens = await this.timelock.receivedTokens(receivers[arrayIndex]);

      balance.should.be.bignumber.equal(amounts[arrayIndex]);
      receivedTokens.should.be.bignumber.equal(balance);
    }
  });

  it('cannot be released twice', async function () {
    await increaseTimeTo(this.releaseTime + duration.years(1));
    await this.timelock.release().should.be.fulfilled;
    await this.timelock.release().should.be.rejected;

    for (const arrayIndex in receivers) {
      const balance = await this.token.balanceOf(receivers[arrayIndex]);
      const receivedTokens = await this.timelock.receivedTokens(receivers[arrayIndex]);

      balance.should.be.bignumber.equal(amounts[arrayIndex]);
      receivedTokens.should.be.bignumber.equal(balance);
    }
  });

  context('like a TokenRecover', function () {
    beforeEach(async function () {
      this.instance = this.timelock;
    });

    shouldBehaveLikeTokenRecover([owner, receivers[0]]);
  });
}

module.exports = {
  shouldBehaveLikeGroupTimelock,
};
