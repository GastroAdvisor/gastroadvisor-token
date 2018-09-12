const { ether } = require('../../helpers/ether');
const { increaseTimeTo } = require('../../helpers/increaseTime');
const { assertRevert } = require('../../helpers/assertRevert');

const { shouldBehaveLikeMintedCrowdsale } = require('./MintedCrowdsale.behaviour');
const { shouldBehaveLikeTimedCrowdsale } = require('./TimedCrowdsale.behaviour');
const { shouldBehaveLikeTokenCappedCrowdsale } = require('./TokenCappedCrowdsale.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const MintableToken = artifacts.require('MintableToken');

function shouldBehaveLikeDefaultCrowdsale ([owner, investor, wallet, purchaser, thirdParty], rate) {
  const value = ether(1);

  context('like a TimedCrowdsale', function () {
    shouldBehaveLikeTimedCrowdsale([owner, investor, wallet, purchaser], rate, value);
  });

  context('like a TokenCappedCrowdsale', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.openingTime);
    });
    shouldBehaveLikeTokenCappedCrowdsale([investor, purchaser]);
  });

  context('like a Minted Crowdsale', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.openingTime);
    });
    shouldBehaveLikeMintedCrowdsale([owner, investor, wallet, purchaser], rate, value);
  });

  context('like a DefaultCrowdsale', function () {
    describe('high-level purchase', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.openingTime);
      });

      it('should add beneficiary to contributions list', async function () {
        let contributorsLength = await this.contributions.getContributorsLength();
        assert.equal(contributorsLength, 0);

        const preTokenBalance = await this.contributions.tokenBalances(investor);
        preTokenBalance.should.be.bignumber.equal(0);
        const preEthBalance = await this.contributions.ethContributions(investor);
        preEthBalance.should.be.bignumber.equal(0);

        await this.crowdsale.sendTransaction({ value, from: investor });

        const postOneTokenBalance = await this.contributions.tokenBalances(investor);
        postOneTokenBalance.should.be.bignumber.equal(value.mul(rate));
        const postOneEthBalance = await this.contributions.ethContributions(investor);
        postOneEthBalance.should.be.bignumber.equal(value);

        await this.crowdsale.sendTransaction({ value, from: investor });

        const postTwoTokenBalance = await this.contributions.tokenBalances(investor);
        (postTwoTokenBalance.sub(postOneTokenBalance)).should.be.bignumber.equal(value.mul(rate));
        postTwoTokenBalance.should.be.bignumber.equal(value.mul(2).mul(rate));
        const postTwoEthBalance = await this.contributions.ethContributions(investor);
        (postTwoEthBalance.sub(postOneEthBalance)).should.be.bignumber.equal(value);
        postTwoEthBalance.should.be.bignumber.equal(value.mul(2));

        contributorsLength = await this.contributions.getContributorsLength();
        assert.equal(contributorsLength, 1);
      });
    });

    describe('high-level purchase', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.openingTime);
      });

      it('should add beneficiary to contributions list', async function () {
        let contributorsLength = await this.contributions.getContributorsLength();
        assert.equal(contributorsLength, 0);

        const preTokenBalance = await this.contributions.tokenBalances(investor);
        preTokenBalance.should.be.bignumber.equal(0);
        const preEthBalance = await this.contributions.ethContributions(investor);
        preEthBalance.should.be.bignumber.equal(0);

        await this.crowdsale.sendTransaction({ value: value, from: investor });

        const postOneTokenBalance = await this.contributions.tokenBalances(investor);
        postOneTokenBalance.should.be.bignumber.equal(value.mul(rate));
        const postOneEthBalance = await this.contributions.ethContributions(investor);
        postOneEthBalance.should.be.bignumber.equal(value);

        await this.crowdsale.sendTransaction({ value: value, from: investor });

        const postTwoTokenBalance = await this.contributions.tokenBalances(investor);
        (postTwoTokenBalance.sub(postOneTokenBalance)).should.be.bignumber.equal(value.mul(rate));
        postTwoTokenBalance.should.be.bignumber.equal(value.mul(2).mul(rate));
        const postTwoEthBalance = await this.contributions.ethContributions(investor);
        (postTwoEthBalance.sub(postOneEthBalance)).should.be.bignumber.equal(value);
        postTwoEthBalance.should.be.bignumber.equal(value.mul(2));

        contributorsLength = await this.contributions.getContributorsLength();
        assert.equal(contributorsLength, 1);
      });
    });

    describe('low-level purchase', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.openingTime);
      });

      it('should add beneficiary to contributions list', async function () {
        let contributorsLength = await this.contributions.getContributorsLength();
        assert.equal(contributorsLength, 0);

        const preTokenBalance = await this.contributions.tokenBalances(investor);
        preTokenBalance.should.be.bignumber.equal(0);
        const preEthBalance = await this.contributions.ethContributions(investor);
        preEthBalance.should.be.bignumber.equal(0);

        await this.crowdsale.buyTokens(investor, { value, from: purchaser });

        const postOneTokenBalance = await this.contributions.tokenBalances(investor);
        postOneTokenBalance.should.be.bignumber.equal(value.mul(rate));
        const postOneEthBalance = await this.contributions.ethContributions(investor);
        postOneEthBalance.should.be.bignumber.equal(value);

        await this.crowdsale.buyTokens(investor, { value, from: purchaser });

        const postTwoTokenBalance = await this.contributions.tokenBalances(investor);
        (postTwoTokenBalance.sub(postOneTokenBalance)).should.be.bignumber.equal(value.mul(rate));
        postTwoTokenBalance.should.be.bignumber.equal(value.mul(2).mul(rate));
        const postTwoEthBalance = await this.contributions.ethContributions(investor);
        (postTwoEthBalance.sub(postOneEthBalance)).should.be.bignumber.equal(value);
        postTwoEthBalance.should.be.bignumber.equal(value.mul(2));

        contributorsLength = await this.contributions.getContributorsLength();
        assert.equal(contributorsLength, 1);
      });
    });

    context('check statuses', function () {
      describe('before start', function () {
        it('started should be false', async function () {
          const toTest = await this.crowdsale.started();
          assert.equal(toTest, false);
        });

        it('ended should be false', async function () {
          const toTest = await this.crowdsale.ended();
          assert.equal(toTest, false);
        });

        it('tokenCapReached should be false', async function () {
          const toTest = await this.crowdsale.tokenCapReached();
          assert.equal(toTest, false);
        });
      });

      describe('after start and before end', function () {
        beforeEach(async function () {
          await increaseTimeTo(this.openingTime);
        });

        it('started should be true', async function () {
          const toTest = await this.crowdsale.started();
          assert.equal(toTest, true);
        });

        describe('if tokenCap not reached', function () {
          it('ended should be false', async function () {
            const toTest = await this.crowdsale.ended();
            assert.equal(toTest, false);
          });

          it('tokenCapReached should be false', async function () {
            const toTest = await this.crowdsale.tokenCapReached();
            assert.equal(toTest, false);
          });
        });

        describe('if tokenCap reached', function () {
          beforeEach(async function () {
            const currentRate = await this.crowdsale.rate();
            const tokenCap = await this.crowdsale.tokenCap();
            const cap = tokenCap.div(currentRate);
            await this.crowdsale.send(cap);
          });

          it('ended should be true', async function () {
            const toTest = await this.crowdsale.ended();
            assert.equal(toTest, true);
          });

          it('tokenCapReached should be true', async function () {
            const toTest = await this.crowdsale.tokenCapReached();
            assert.equal(toTest, true);
          });
        });
      });

      describe('after end', function () {
        beforeEach(async function () {
          await increaseTimeTo(this.afterClosingTime);
        });

        it('started should be true', async function () {
          const toTest = await this.crowdsale.started();
          assert.equal(toTest, true);
        });

        it('ended should be true', async function () {
          const toTest = await this.crowdsale.ended();
          assert.equal(toTest, true);
        });
      });
    });
  });

  context('safe functions', function () {
    describe('transferAnyERC20Token', function () {
      let anotherERC20;
      const tokenAmount = new BigNumber(1000);

      beforeEach(async function () {
        anotherERC20 = await MintableToken.new({ from: owner });
        await anotherERC20.mint(this.crowdsale.address, tokenAmount, { from: owner });
      });

      describe('if owner is calling', function () {
        it('should safe transfer any ERC20 sent for error into the contract', async function () {
          const contractPre = await anotherERC20.balanceOf(this.crowdsale.address);
          contractPre.should.be.bignumber.equal(tokenAmount);
          const ownerPre = await anotherERC20.balanceOf(owner);
          ownerPre.should.be.bignumber.equal(0);

          await this.crowdsale.transferAnyERC20Token(anotherERC20.address, tokenAmount, { from: owner });

          const contractPost = await anotherERC20.balanceOf(this.crowdsale.address);
          contractPost.should.be.bignumber.equal(0);
          const ownerPost = await anotherERC20.balanceOf(owner);
          ownerPost.should.be.bignumber.equal(tokenAmount);
        });
      });

      describe('if third party is calling', function () {
        it('reverts', async function () {
          await assertRevert(
            this.crowdsale.transferAnyERC20Token(anotherERC20.address, tokenAmount, { from: thirdParty })
          );
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeDefaultCrowdsale,
};