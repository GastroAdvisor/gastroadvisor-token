const { ether } = require('../../helpers/ether');
const { increaseTimeTo } = require('../../helpers/increaseTime');

const { shouldBehaveLikeDefaultCrowdsale } = require('./DefaultCrowdsale.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikePostDeliveryCrowdsale ([owner, investor, wallet, purchaser, thirdParty], rate) {
  const value = ether(1);

  context('like a Default Crowdsale', function () {
    shouldBehaveLikeDefaultCrowdsale([owner, investor, wallet, purchaser, thirdParty], rate);
  });

  context('like a PostDeliveryCrowdsale', function () {
    describe('high-level purchase', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.openingTime);
      });

      it('balance of contributions should be equal to total token supply', async function () {
        const preTotalSupply = await this.token.totalSupply();
        preTotalSupply.should.be.bignumber.equal(0);
        const preTokenBalance = await this.token.balanceOf(this.contributions.address);
        preTokenBalance.should.be.bignumber.equal(0);

        await this.crowdsale.sendTransaction({ value: value, from: investor }).should.be.fulfilled;

        const postTokenBalance = await this.token.balanceOf(this.contributions.address);
        const postTotalSupply = await this.token.totalSupply();

        postTokenBalance.should.be.bignumber.equal(postTotalSupply);
      });
    });

    describe('low-level purchase', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.openingTime);
      });

      it('balance of contributions should be equal to total token supply', async function () {
        const preTotalSupply = await this.token.totalSupply();
        preTotalSupply.should.be.bignumber.equal(0);
        const preTokenBalance = await this.token.balanceOf(this.contributions.address);
        preTokenBalance.should.be.bignumber.equal(0);

        await this.crowdsale.buyTokens(investor, { value, from: purchaser }).should.be.fulfilled;

        const postTokenBalance = await this.token.balanceOf(this.contributions.address);
        const postTotalSupply = await this.token.totalSupply();

        postTokenBalance.should.be.bignumber.equal(postTotalSupply);
      });
    });
  });
}

module.exports = {
  shouldBehaveLikePostDeliveryCrowdsale,
};
