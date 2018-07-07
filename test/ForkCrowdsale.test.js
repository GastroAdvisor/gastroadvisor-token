import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import assertRevert from './helpers/assertRevert';

import shouldBehaveLikeTimedCrowdsale from './behaviours/TimedCrowdsale.behaviour';
import shouldBehaveLikeCrowdsale from './behaviours/Crowdsale.behaviour';
import shouldBehaveLikeMintedCrowdsale from './behaviours/MintedCrowdsale.behaviour';
import shouldBehaveLikeCappedCrowdsale from './behaviours/CappedCrowdsale.behaviour';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ForkCrowdsale = artifacts.require('ForkCrowdsale');
const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');
const Contributions = artifacts.require('Contributions');

const ROLE_MINTER = 'minter';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('ForkCrowdsale', function ([owner, investor, wallet, purchaser, thirdParty]) {
  const rate = new BigNumber(10);
  const value = ether(1);
  const tokenCap = new BigNumber(100);

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.openingTime = latestTime() + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);

    this.token = await GastroAdvisorToken.new();
    this.contributions = await Contributions.new();
    this.crowdsale = await ForkCrowdsale.new(
      this.openingTime,
      this.closingTime,
      rate,
      wallet,
      tokenCap,
      this.token.address,
      this.contributions.address
    );

    await this.token.addMinter(this.crowdsale.address);
    await this.contributions.addMinter(this.crowdsale.address);
  });

  context('like a TimedCrowdsale', function () {
    shouldBehaveLikeTimedCrowdsale([owner, investor, wallet, purchaser], rate, value);
  });

  context('like a Crowdsale', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.openingTime);
    });
    shouldBehaveLikeCrowdsale([owner, investor, wallet, purchaser], rate, value);
  });

  context('like a MintedCrowdsale', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.openingTime);
    });
    shouldBehaveLikeMintedCrowdsale([owner, investor, wallet, purchaser], rate, value);
  });

  context('like a CappedCrowdsale', function () {
    beforeEach(async function () {
      await increaseTimeTo(this.openingTime);
    });
    shouldBehaveLikeCappedCrowdsale([investor, purchaser]);
  });

  context('like a ForkCrowdsale', function () {
    describe('creating a valid crowdsale', function () {
      it('should be token minter', async function () {
        const isMinter = await this.token.hasRole(this.crowdsale.address, ROLE_MINTER);
        isMinter.should.equal(true);
      });

      it('cap should be right set by token cap', async function () {
        const decimals = await this.token.decimals();
        const excpectedCap = tokenCap.mul(Math.pow(10, decimals)).div(rate);
        const cap = await this.crowdsale.cap();

        cap.should.be.bignumber.equal(excpectedCap);
      });

      it('should fail with zero rate', async function () {
        await assertRevert(
          ForkCrowdsale.new(
            this.openingTime,
            this.closingTime,
            0,
            wallet,
            tokenCap,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if wallet is the zero address', async function () {
        await assertRevert(
          ForkCrowdsale.new(
            this.openingTime,
            this.closingTime,
            rate,
            ZERO_ADDRESS,
            tokenCap,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if token is the zero address', async function () {
        await assertRevert(
          ForkCrowdsale.new(
            this.openingTime,
            this.closingTime,
            rate,
            wallet,
            tokenCap,
            ZERO_ADDRESS,
            this.contributions.address
          )
        );
      });

      it('should fail if opening time is in the past', async function () {
        await assertRevert(
          ForkCrowdsale.new(
            latestTime() - duration.seconds(1),
            this.closingTime,
            rate,
            wallet,
            tokenCap,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if opening time is after closing time in the past', async function () {
        await assertRevert(
          ForkCrowdsale.new(
            this.closingTime,
            this.openingTime,
            rate,
            wallet,
            tokenCap,
            this.token.address,
            this.contributions.address
          )
        );
      });

      it('should fail if contributions is the zero address', async function () {
        await assertRevert(
          ForkCrowdsale.new(
            this.openingTime,
            this.closingTime,
            rate,
            wallet,
            tokenCap,
            this.token.address,
            ZERO_ADDRESS
          )
        );
      });

      it('should fail with o token cap', async function () {
        await assertRevert(
          ForkCrowdsale.new(
            this.openingTime,
            this.closingTime,
            rate,
            wallet,
            0,
            this.token.address,
            this.contributions.address
          )
        );
      });
    });

    describe('high-level purchase', function () {
      beforeEach(async function () {
        await increaseTimeTo(this.openingTime);
      });

      it('should add beneficiary to contributions list', async function () {
        let contributorsLength = await this.contributions.getContributorsLength();
        assert.equal(contributorsLength, 0);

        const pre = await this.contributions.tokenBalances(investor);
        pre.should.be.bignumber.equal(0);

        await this.crowdsale.sendTransaction({ value, from: investor });

        const post = await this.contributions.tokenBalances(investor);
        post.should.be.bignumber.equal(value.mul(rate));

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

        const pre = await this.contributions.tokenBalances(investor);
        pre.should.be.bignumber.equal(0);

        await this.crowdsale.buyTokens(investor, { value, from: purchaser });

        const post = await this.contributions.tokenBalances(investor);
        post.should.be.bignumber.equal(value.mul(rate));

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

        it('capReached should be false', async function () {
          const toTest = await this.crowdsale.capReached();
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

        describe('if cap not reached', function () {
          it('ended should be false', async function () {
            const toTest = await this.crowdsale.ended();
            assert.equal(toTest, false);
          });

          it('capReached should be false', async function () {
            const toTest = await this.crowdsale.capReached();
            assert.equal(toTest, false);
          });
        });

        describe('if cap reached', function () {
          beforeEach(async function () {
            const cap = await this.crowdsale.cap();
            await this.crowdsale.send(cap);
          });

          it('ended should be true', async function () {
            const toTest = await this.crowdsale.ended();
            assert.equal(toTest, true);
          });

          it('capReached should be true', async function () {
            const toTest = await this.crowdsale.capReached();
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
      let tokenAmount = new BigNumber(1000);

      beforeEach(async function () {
        anotherERC20 = await GastroAdvisorToken.new({ from: owner });

        await anotherERC20.addMinter(owner, { from: owner });
        await anotherERC20.mint(this.crowdsale.address, tokenAmount, { from: owner });
        await anotherERC20.finishMinting({ from: owner });
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
});
