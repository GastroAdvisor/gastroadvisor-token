import assertRevert from './helpers/assertRevert';
import expectEvent from './helpers/expectEvent';
import ether from "./helpers/ether";

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Contributions = artifacts.require('Contributions');

contract('Contributions', function ([_, owner, minter, futureMinter, thirdParty, anotherThirdParty]) {
  const tokenToAdd = new BigNumber(100);
  const ethToAdd = ether(1);

  beforeEach(async function () {
    this.contributions = await Contributions.new({ from: owner });
    await this.contributions.addMinter(minter, { from: owner });
  });

  describe('if minter is calling', function () {
    it('should success to add amounts to the address balances', async function () {
      let tokenBalance = await this.contributions.tokenBalances(thirdParty);
      tokenBalance.should.be.bignumber.equal(0);
      let ethBalance = await this.contributions.ethContributions(thirdParty);
      ethBalance.should.be.bignumber.equal(0);

      await this.contributions.addBalance(thirdParty, ethToAdd, tokenToAdd, { from: minter });

      tokenBalance = await this.contributions.tokenBalances(thirdParty);
      tokenBalance.should.be.bignumber.equal(tokenToAdd);
      ethBalance = await this.contributions.ethContributions(thirdParty);
      ethBalance.should.be.bignumber.equal(ethToAdd);

      await this.contributions.addBalance(thirdParty, ethToAdd.mul(3), tokenToAdd.mul(3), { from: minter });

      tokenBalance = await this.contributions.tokenBalances(thirdParty);
      tokenBalance.should.be.bignumber.equal(tokenToAdd.mul(4));
      ethBalance = await this.contributions.ethContributions(thirdParty);
      ethBalance.should.be.bignumber.equal(ethToAdd.mul(4));
    });

    it('should increase array length when different address are passed', async function () {
      let contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 0);

      await this.contributions.addBalance(thirdParty, ethToAdd, tokenToAdd, { from: minter });

      contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 1);

      await this.contributions.addBalance(anotherThirdParty, ethToAdd, tokenToAdd, { from: minter });

      contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 2);
    });

    it('should not increase array length when same address is passed', async function () {
      let contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 0);

      await this.contributions.addBalance(thirdParty, ethToAdd, tokenToAdd, { from: minter });

      contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 1);

      await this.contributions.addBalance(thirdParty, ethToAdd, tokenToAdd, { from: minter });

      contributorsLength = await this.contributions.getContributorsLength();
      assert.equal(contributorsLength, 1);
    });

    it('should cycle addresses and have the right value set', async function () {
      await this.contributions.addBalance(owner, ethToAdd.mul(3), tokenToAdd.mul(3), { from: minter });
      await this.contributions.addBalance(thirdParty, ethToAdd.mul(4), tokenToAdd.mul(4), { from: minter });
      await this.contributions.addBalance(anotherThirdParty, ethToAdd, tokenToAdd, { from: minter });
      await this.contributions.addBalance(anotherThirdParty, ethToAdd, tokenToAdd, { from: minter });

      let tokenBalances = [];
      tokenBalances[owner] = await this.contributions.tokenBalances(owner);
      tokenBalances[thirdParty] = await this.contributions.tokenBalances(thirdParty);
      tokenBalances[anotherThirdParty] = await this.contributions.tokenBalances(anotherThirdParty);

      let ethBalances = [];
      ethBalances[owner] = await this.contributions.ethContributions(owner);
      ethBalances[thirdParty] = await this.contributions.ethContributions(thirdParty);
      ethBalances[anotherThirdParty] = await this.contributions.ethContributions(anotherThirdParty);


      let contributorsLength = (await this.contributions.getContributorsLength()).valueOf();

      for (let i = 0; i < contributorsLength; i++) {
        let address = await this.contributions.addresses(i);
        let tokenBalance = await this.contributions.tokenBalances(address);
        let ethBalance = await this.contributions.ethContributions(address);

        tokenBalance.should.be.bignumber.equal(tokenBalances[address]);
        ethBalance.should.be.bignumber.equal(ethBalances[address]);
      }
    });
  });

  describe('if third party is calling', function () {
    it('reverts and fail to add amounts to the address balances', async function () {
      let tokenBalance = await this.contributions.tokenBalances(thirdParty);
      let ethBalance = await this.contributions.ethContributions(thirdParty);
      assert.equal(tokenBalance, 0);
      assert.equal(ethBalance, 0);

      await assertRevert(
        this.contributions.addBalance(thirdParty, ethToAdd, tokenToAdd, { from: thirdParty })
      );

      tokenBalance = await this.contributions.tokenBalances(thirdParty);
      ethBalance = await this.contributions.ethContributions(thirdParty);

      assert.equal(tokenBalance, 0);
      assert.equal(ethBalance, 0);
    });
  });

  context('test RBAC functions', function () {
    describe('in normal conditions', function () {
      it('allows owner to add a minter', async function () {
        await this.contributions.addMinter(futureMinter, { from: owner }).should.be.fulfilled;
      });

      it('allows owner to remove a minter', async function () {
        await this.contributions.addMinter(futureMinter, { from: owner }).should.be.fulfilled;
        await this.contributions.removeMinter(futureMinter, { from: owner }).should.be.fulfilled;
      });

      it('announces a RoleAdded event on addRole', async function () {
        await expectEvent.inTransaction(
          this.contributions.addMinter(futureMinter, { from: owner }),
          'RoleAdded'
        );
      });

      it('announces a RoleRemoved event on removeRole', async function () {
        await expectEvent.inTransaction(
          this.contributions.removeMinter(minter, { from: owner }),
          'RoleRemoved'
        );
      });
    });

    describe('in adversarial conditions', function () {
      it('does not allow "thirdParty" except owner to add a minter', async function () {
        await assertRevert(
          this.contributions.addMinter(futureMinter, { from: minter })
        );
        await assertRevert(
          this.contributions.addMinter(futureMinter, { from: thirdParty })
        );
      });

      it('does not allow "thirdParty" except owner to remove a minter', async function () {
        await this.contributions.addMinter(futureMinter, { from: owner }).should.be.fulfilled;
        await assertRevert(
          this.contributions.removeMinter(futureMinter, { from: minter })
        );
        await assertRevert(
          this.contributions.removeMinter(futureMinter, { from: thirdParty })
        );
      });
    });
  });
});
