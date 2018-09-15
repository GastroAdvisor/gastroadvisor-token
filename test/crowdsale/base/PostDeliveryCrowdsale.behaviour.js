const { ether } = require('../../helpers/ether');
const { increaseTimeTo } = require('../../helpers/increaseTime');
const { assertRevert } = require('../../helpers/assertRevert');

const { shouldBehaveLikeDefaultCrowdsale } = require('./DefaultCrowdsale.behaviour');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikePostDeliveryCrowdsale ([owner, investor, wallet, purchaser, thirdParty], rate) {
  const value = ether(1);
  const expectedTokenAmount = rate.mul(value);

  context('like a Default Crowdsale', function () {
    shouldBehaveLikeDefaultCrowdsale([owner, investor, wallet, purchaser, thirdParty], rate);
  });

  context('like a PostDeliveryCrowdsale', function () {
    describe('high-level purchase', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.openingTime);
      });

      it('should not immediately assign tokens to beneficiary', async function () {
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        const balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(0);
      });

      it('should assign tokens to self', async function () {
        const preBalance = await this.token.balanceOf(this.crowdsale.address);
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        const postBalance = await this.token.balanceOf(this.crowdsale.address);
        (postBalance.sub(preBalance)).should.be.bignumber.equal(expectedTokenAmount);
      });

      it('balance of crowdsale should be equal to total token supply', async function () {
        const preTotalSupply = await this.token.totalSupply();
        preTotalSupply.should.be.bignumber.equal(0);
        const preTokenBalance = await this.token.balanceOf(this.crowdsale.address);
        preTokenBalance.should.be.bignumber.equal(0);

        await this.crowdsale.sendTransaction({ value: value, from: investor }).should.be.fulfilled;

        const postTokenBalance = await this.token.balanceOf(this.crowdsale.address);
        const postTotalSupply = await this.token.totalSupply();

        postTokenBalance.should.be.bignumber.equal(postTotalSupply);
      });
    });

    describe('low-level purchase', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.openingTime);
      });

      it('should not immediately assign tokens to beneficiary', async function () {
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
        const balance = await this.token.balanceOf(investor);
        balance.should.be.bignumber.equal(0);
      });

      it('should assign tokens to self', async function () {
        const preBalance = await this.token.balanceOf(this.crowdsale.address);
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
        const postBalance = await this.token.balanceOf(this.crowdsale.address);
        (postBalance.sub(preBalance)).should.be.bignumber.equal(expectedTokenAmount);
      });

      it('balance of self should be equal to total token supply', async function () {
        const preTotalSupply = await this.token.totalSupply();
        preTotalSupply.should.be.bignumber.equal(0);
        const preTokenBalance = await this.token.balanceOf(this.crowdsale.address);
        preTokenBalance.should.be.bignumber.equal(0);

        await this.crowdsale.buyTokens(investor, { value, from: purchaser }).should.be.fulfilled;

        const postTokenBalance = await this.token.balanceOf(this.crowdsale.address);
        const postTotalSupply = await this.token.totalSupply();

        postTokenBalance.should.be.bignumber.equal(postTotalSupply);
      });
    });

    context('sending tokens', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.buyTokens(owner, { value, from: owner });
        await this.crowdsale.buyTokens(investor, { value, from: investor });
        await this.crowdsale.buyTokens(purchaser, { value, from: purchaser });
        await this.crowdsale.buyTokens(thirdParty, { value, from: thirdParty });
      });

      describe('before campaign end', function () {
        it('reverts', async function () {
          await assertRevert(this.crowdsale.multiSend(0, 1, { from: owner }));
        });
      });

      describe('after campaign end', function () {
        beforeEach(async function () {
          await increaseTimeTo(this.afterClosingTime);
        });

        describe('while minting', function () {
          it('reverts', async function () {
            await assertRevert(this.crowdsale.multiSend(0, 1, { from: owner }));
          });
        });

        describe('after finish minting', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: owner });
          });

          describe('if owner is calling', function () {
            it('success', async function () {
              const start = 0;
              const limit = 1;
              await this.crowdsale.multiSend(start, limit, { from: owner }).should.be.fulfilled;
            });

            it('send tokens', async function () {
              const start = 0;
              const limit = 1;
              const addressIndex = 0;

              const address = await this.crowdsale.beneficiaryAddresses(addressIndex);
              const tokens = await this.crowdsale.futureBalances(address);

              await this.crowdsale.multiSend(start, limit, { from: owner });

              const balance = await this.token.balanceOf(address);
              balance.should.be.bignumber.equal(tokens);
            });

            it('reset futureBalances value', async function () {
              const start = 0;
              const limit = 1;
              const addressIndex = 0;

              const address = await this.crowdsale.beneficiaryAddresses(addressIndex);

              await this.crowdsale.multiSend(start, limit, { from: owner });

              const tokens = await this.crowdsale.futureBalances(address);
              tokens.should.be.bignumber.equal(0);
            });

            describe('if calling twice on different addresses', function () {
              it('success', async function () {
                let start = 0;
                const limit = 1;
                await this.crowdsale.multiSend(start, limit, { from: owner }).should.be.fulfilled;

                start = start + limit;
                await this.crowdsale.multiSend(start, limit, { from: owner }).should.be.fulfilled;
              });

              it('send tokens', async function () {
                let start = 0;
                const limit = 1;

                let address = await this.crowdsale.beneficiaryAddresses(start);
                let tokens = await this.crowdsale.futureBalances(address);
                let pre = await this.token.balanceOf(address);
                await this.crowdsale.multiSend(start, limit, { from: owner });
                let post = await this.token.balanceOf(address);
                post.should.be.bignumber.equal(pre.add(tokens));

                start = start + limit;

                address = await this.crowdsale.beneficiaryAddresses(start);
                tokens = await this.crowdsale.futureBalances(address);
                pre = await this.token.balanceOf(address);
                await this.crowdsale.multiSend(start, limit, { from: owner });
                post = await this.token.balanceOf(address);
                post.should.be.bignumber.equal(pre.add(tokens));
              });

              it('reset tokens value', async function () {
                let start = 0;
                const limit = 1;

                let address = await this.crowdsale.beneficiaryAddresses(start);
                await this.crowdsale.multiSend(start, limit, { from: owner });
                let tokens = await this.crowdsale.futureBalances(address);
                tokens.should.be.bignumber.equal(0);

                start = start + limit;

                address = await this.crowdsale.beneficiaryAddresses(start);
                await this.crowdsale.multiSend(start, limit, { from: owner });
                tokens = await this.crowdsale.futureBalances(address);
                tokens.should.be.bignumber.equal(0);
              });
            });

            describe('if calling twice on the same addresses', function () {
              it('does nothing', async function () {
                const start = 0;
                const limit = 1;
                const addressIndex = 0;

                const address = await this.crowdsale.beneficiaryAddresses(addressIndex);
                let tokens = await this.crowdsale.futureBalances(address);

                const pre = await this.token.balanceOf(address);
                await this.crowdsale.multiSend(start, limit, { from: owner });
                await this.crowdsale.multiSend(start, limit, { from: owner });

                const post = await this.token.balanceOf(address);
                post.should.be.bignumber.equal(pre.add(tokens));
                tokens = await this.crowdsale.futureBalances(address);
                tokens.should.be.bignumber.equal(0);
              });
            });
          });

          describe('if thirdParty is calling', function () {
            it('reverts', async function () {
              await assertRevert(this.crowdsale.multiSend(0, 1, { from: thirdParty }));
            });
          });
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikePostDeliveryCrowdsale,
};
