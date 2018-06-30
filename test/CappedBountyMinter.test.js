import assertRevert from './helpers/assertRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const CappedBountyMinter = artifacts.require('CappedBountyMinter');
const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('CappedBountyMinter', function (
  [tokenOwner, bountyOwner, anotherAccount, receiver1, receiver2, receiver3]
) {
  const cap = new BigNumber(20000);

  const addresses = [receiver1, receiver2, receiver3];
  const amounts = [100, 200, 300];

  beforeEach(async function () {
    this.token = await GastroAdvisorToken.new({ from: tokenOwner });
    this.decimals = await this.token.decimals();
    this.bounty = await CappedBountyMinter.new(this.token.address, cap, { from: bountyOwner });
    await this.token.addMinter(this.bounty.address, { from: tokenOwner });
  });

  context('creating a valid bounty', function () {
    describe('if valid', function () {
      it('has a valid token', async function () {
        const bountyToken = await this.bounty.token();
        assert.equal(bountyToken, this.token.address);
      });
      it('has a valid cap', async function () {
        const bountyCap = await this.bounty.cap();
        bountyCap.should.be.bignumber.equal(
          new BigNumber(cap.valueOf() * Math.pow(10, this.decimals))
        );
      });
    });

    describe('if token address is the zero address', function () {
      it('reverts', async function () {
        await assertRevert(
          CappedBountyMinter.new(ZERO_ADDRESS, cap, { from: bountyOwner })
        );
      });
    });

    describe('if cap is zero', function () {
      it('reverts', async function () {
        await assertRevert(
          CappedBountyMinter.new(this.token.address, 0, { from: bountyOwner })
        );
      });
    });
  });

  context('sending bounty tokens', function () {
    describe('if bounty owner is calling', function () {
      it('should transfer tokens for given addresses', async function () {
        for (let arrayIndex in addresses) {
          let receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
          receiverBalance.should.be.bignumber.equal(0);
        }

        await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });

        for (let arrayIndex in addresses) {
          let receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);

          let excpectedToken = amounts[arrayIndex] * Math.pow(10, this.decimals);
          receiverBalance.should.be.bignumber.equal(new BigNumber(excpectedToken));
        }
      });

      it('should increase givenBountyTokens', async function () {
        for (let arrayIndex in addresses) {
          let receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
          receiverBalance.should.be.bignumber.equal(0);
        }

        await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });

        for (let arrayIndex in addresses) {
          let givenBountyTokens = await this.bounty.givenBountyTokens(addresses[arrayIndex]);

          let excpectedToken = amounts[arrayIndex] * Math.pow(10, this.decimals);
          givenBountyTokens.should.be.bignumber.equal(new BigNumber(excpectedToken));
        }
      });

      it('should increase totalGivenBountyTokens', async function () {
        let totalGivenTokens = 0;

        await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });

        for (let arrayIndex in amounts) {
          totalGivenTokens += amounts[arrayIndex] * Math.pow(10, this.decimals);
        }
        const totalGivenBountyTokens = await this.bounty.totalGivenBountyTokens();
        totalGivenBountyTokens.should.be.bignumber.equal(new BigNumber(totalGivenTokens));
      });

      it('should decrease remainingTokens', async function () {
        let totalGivenTokens = 0;

        await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });

        for (let arrayIndex in amounts) {
          totalGivenTokens += amounts[arrayIndex] * Math.pow(10, this.decimals);
        }
        const remainingTokens = await this.bounty.remainingTokens();
        remainingTokens.should.be.bignumber.equal(
          new BigNumber(cap.valueOf() * Math.pow(10, this.decimals)).sub(totalGivenTokens)
        );
      });

      describe('calling twice', function () {
        it('should transfer tokens for given addresses', async function () {
          for (let arrayIndex in addresses) {
            let receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
            receiverBalance.should.be.bignumber.equal(0);
          }

          await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });
          await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });

          for (let arrayIndex in addresses) {
            let receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);

            let excpectedToken = amounts[arrayIndex] * Math.pow(10, this.decimals);
            receiverBalance.should.be.bignumber.equal(new BigNumber(excpectedToken).mul(2));
          }
        });

        it('should increase givenBountyTokens', async function () {
          for (let arrayIndex in addresses) {
            let receiverBalance = await this.token.balanceOf(addresses[arrayIndex]);
            receiverBalance.should.be.bignumber.equal(0);
          }

          await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });
          await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });

          for (let arrayIndex in addresses) {
            let givenBountyTokens = await this.bounty.givenBountyTokens(addresses[arrayIndex]);

            let excpectedToken = amounts[arrayIndex] * Math.pow(10, this.decimals);
            givenBountyTokens.should.be.bignumber.equal(new BigNumber(excpectedToken).mul(2));
          }
        });

        it('should increase totalGivenBountyTokens', async function () {
          let totalGivenTokens = 0;

          await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });
          await this.bounty.multiSend(addresses, amounts, { from: bountyOwner });

          for (let arrayIndex in amounts) {
            totalGivenTokens += amounts[arrayIndex] * Math.pow(10, this.decimals);
          }
          const totalGivenBountyTokens = await this.bounty.totalGivenBountyTokens();
          totalGivenBountyTokens.should.be.bignumber.equal(new BigNumber(totalGivenTokens).mul(2));
        });
      });

      describe('if minting more than the cap', function () {
        it('reverts', async function () {
          const moreThanTheCap = cap.add(1);
          await assertRevert(
            this.bounty.multiSend([receiver1], [moreThanTheCap], { from: bountyOwner })
          );
        });
      });

      describe('if addresses are empty', function () {
        it('reverts', async function () {
          await assertRevert(
            this.bounty.multiSend([], amounts, { from: bountyOwner })
          );
        });
      });

      describe('if amounts are empty', function () {
        it('reverts', async function () {
          await assertRevert(
            this.bounty.multiSend(addresses, [], { from: bountyOwner })
          );
        });
      });

      describe('if amounts length is not equal to addresses length', function () {
        it('reverts', async function () {
          await assertRevert(
            this.bounty.multiSend([addresses[0]], [amounts[0], amounts[1]], { from: bountyOwner })
          );
        });
      });
    });

    describe('if token owner is calling', function () {
      it('reverts', async function () {
        await assertRevert(
          this.bounty.multiSend(addresses, amounts, { from: tokenOwner })
        );
      });
    });

    describe('if another account is calling', function () {
      it('reverts', async function () {
        await assertRevert(
          this.bounty.multiSend(addresses, amounts, { from: anotherAccount })
        );
      });
    });
  });

  describe('safe functions', function () {
    it('should safe transfer any ERC20 sent for error into the contract', async function () {
      const anotherERC20 = await GastroAdvisorToken.new({ from: tokenOwner });

      const tokenAmount = 1000;

      await anotherERC20.addMinter(tokenOwner, { from: tokenOwner });
      await anotherERC20.mint(this.bounty.address, tokenAmount, { from: tokenOwner });
      await anotherERC20.finishMinting({ from: tokenOwner });

      const contractPre = await anotherERC20.balanceOf(this.bounty.address);
      assert.equal(contractPre, tokenAmount);
      const ownerPre = await anotherERC20.balanceOf(tokenOwner);
      assert.equal(ownerPre, 0);

      await this.bounty.transferAnyERC20Token(anotherERC20.address, tokenAmount, { from: bountyOwner });

      const contractPost = await anotherERC20.balanceOf(this.bounty.address);
      assert.equal(contractPost, 0);
      const ownerPost = await anotherERC20.balanceOf(bountyOwner);
      assert.equal(ownerPost, tokenAmount);
    });
  });
});
