import assertRevert from './helpers/assertRevert';

import shouldBehaveLikeDetailedERC20Token from './behaviours/DetailedERC20.behaviour';
import shouldBehaveLikeMintableToken from './behaviours/MintableToken.behaviour';
import shouldBehaveLikeRBACMintableToken from './behaviours/RBACMintableToken.behaviour';
import shouldBehaveLikeBurnableToken from './behaviours/BurnableToken.behaviour';
import shouldBehaveLikeStandardToken from './behaviours/StandardToken.behaviour';
import shouldBehaveERC827Token from './behaviours/ERC827Token.behaviour';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Message = artifacts.require('MessageHelper');
const GastroAdvisorToken = artifacts.require('GastroAdvisorToken');

contract('GastroAdvisorToken', function ([owner, anotherAccount, minter, recipient]) {
  beforeEach(async function () {
    this.token = await GastroAdvisorToken.new({ from: owner });
  });

  context('like a DetailedERC20 token', function () {
    shouldBehaveLikeDetailedERC20Token();
  });

  context('like a MintableToken', function () {
    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
    });
    shouldBehaveLikeMintableToken([owner, anotherAccount, minter]);
  });

  context('like a RBACMintableToken', function () {
    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
    });
    shouldBehaveLikeRBACMintableToken([owner, anotherAccount, minter]);
  });

  context('like a BurnableToken', function () {
    const initialBalance = 1000;

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, initialBalance, { from: minter });
    });
    shouldBehaveLikeBurnableToken([owner], initialBalance);
  });

  context('like a StandardToken', function () {
    const initialBalance = 1000;

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, initialBalance, { from: minter });
      await this.token.finishMinting({ from: owner });
    });
    shouldBehaveLikeStandardToken([owner, anotherAccount, recipient], initialBalance);
  });

  context('like a ERC827Token', function () {
    const initialBalance = 100;

    beforeEach(async function () {
      await this.token.addMinter(minter, { from: owner });
      await this.token.mint(owner, initialBalance, { from: minter });
      await this.token.finishMinting({ from: owner });
    });
    shouldBehaveERC827Token([owner, anotherAccount, minter, recipient]);
  });

  context('like a GastroAdvisor token', function () {
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

    it('should fail payment through transfer before finish minting', async function () {
      const message = await Message.new();

      const extraData = message.contract.buyMessage.getData(
        web3.toHex(123456), 666, 'Transfer Done'
      );

      await assertRevert(
        this.token.transferAndCall(
          message.contract.address, initialBalance, extraData, { from: owner, value: 1000 }
        )
      );
    });

    it('should fail payment through transferFrom before finish minting', async function () {
      const message = await Message.new();

      const extraData = message.contract.buyMessage.getData(
        web3.toHex(123456), 666, 'Transfer Done'
      );

      await this.token.approve(anotherAccount, initialBalance, { from: owner });

      new BigNumber(initialBalance).should.be.bignumber.equal(
        await this.token.allowance(owner, anotherAccount)
      );

      await assertRevert(this.token.transferFromAndCall(
        owner, message.contract.address, 100, extraData, { from: anotherAccount, value: 1000 }
      )
      );
    });

    it('should fail transfer (with data) before finish minting', async function () {
      const message = await Message.new();

      const extraData = message.contract.showMessage.getData(
        web3.toHex(123456), 666, 'Transfer Done'
      );

      await assertRevert(this.token.transferAndCall(message.contract.address, initialBalance, extraData));
    });

    it('should fail transferFrom (with data) before finish minting', async function () {
      const message = await Message.new();

      const extraData = message.contract.showMessage.getData(
        web3.toHex(123456), 666, 'Transfer Done'
      );

      await this.token.approve(anotherAccount, initialBalance, { from: owner });

      new BigNumber(initialBalance).should.be.bignumber.equal(
        await this.token.allowance(owner, anotherAccount)
      );

      await assertRevert(
        this.token.transferFromAndCall(owner, message.contract.address, initialBalance, extraData, {
          from: anotherAccount,
        })
      );
    });
  });

  describe('safe functions', function () {
    it('should safe transfer any ERC20 sent for error into the contract', async function () {
      const anotherERC20 = await GastroAdvisorToken.new({ from: owner });

      const tokenAmount = 1000;

      await anotherERC20.addMinter(minter, { from: owner });
      await anotherERC20.mint(this.token.address, tokenAmount, { from: minter });
      await anotherERC20.finishMinting({ from: owner });

      const contractPre = await anotherERC20.balanceOf(this.token.address);
      assert.equal(contractPre, tokenAmount);
      const ownerPre = await anotherERC20.balanceOf(owner);
      assert.equal(ownerPre, 0);

      await this.token.transferAnyERC20Token(anotherERC20.address, tokenAmount, { from: owner });

      const contractPost = await anotherERC20.balanceOf(this.token.address);
      assert.equal(contractPost, 0);
      const ownerPost = await anotherERC20.balanceOf(owner);
      assert.equal(ownerPost, tokenAmount);
    });
  });
});
