const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeMintedCrowdsale ([owner, investor, wallet, purchaser], rate, value) {
  const expectedTokenAmount = rate.mul(value);

  describe('accepting payments', function () {
    it('should accept payments', async function () {
      await this.crowdsale.sendTransaction({ value: value, from: investor }).should.be.fulfilled;
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;
    });
  });

  describe('high-level purchase', function () {
    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investor });
      const event = logs.find(e => e.event === 'TokenPurchase');
      should.exist(event);
      event.args.purchaser.should.equal(investor);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should not immediately assign tokens to beneficiary', async function () {
      await this.crowdsale.sendTransaction({ value: value, from: investor });
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(0);
    });

    it('should assign tokens to contributions contract', async function () {
      const preBalance = await this.token.balanceOf(this.contributions.address);
      await this.crowdsale.sendTransaction({ value: value, from: investor });
      const postBalance = await this.token.balanceOf(this.contributions.address);
      (postBalance.sub(preBalance)).should.be.bignumber.equal(expectedTokenAmount);
    });

    it('weiRaised should increase', async function () {
      await this.crowdsale.sendTransaction({ value: value.div(2), from: investor });
      await this.crowdsale.sendTransaction({ value: value.div(2), from: investor });

      const weiRaised = await this.crowdsale.weiRaised();
      weiRaised.should.be.bignumber.equal(value);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.sendTransaction({ value, from: investor });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });
  });

  describe('low-level purchase', function () {
    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      const event = logs.find(e => e.event === 'TokenPurchase');
      should.exist(event);
      event.args.purchaser.should.equal(purchaser);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should not immediately assign tokens to beneficiary', async function () {
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(0);
    });

    it('should assign tokens to contributions contract', async function () {
      const preBalance = await this.token.balanceOf(this.contributions.address);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      const postBalance = await this.token.balanceOf(this.contributions.address);
      (postBalance.sub(preBalance)).should.be.bignumber.equal(expectedTokenAmount);
    });

    it('weiRaised should increase', async function () {
      await this.crowdsale.buyTokens(investor, { value: value.div(2), from: purchaser });
      await this.crowdsale.buyTokens(investor, { value: value.div(2), from: purchaser });

      const weiRaised = await this.crowdsale.weiRaised();
      weiRaised.should.be.bignumber.equal(value);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });
  });
}

module.exports = {
  shouldBehaveLikeMintedCrowdsale,
};