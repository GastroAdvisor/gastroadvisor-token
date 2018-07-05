import { increaseTimeTo } from '../helpers/increaseTime';
import assertRevert from '../helpers/assertRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

export default function ([owner, investor, wallet, purchaser], rate, value) {
  it('should be ended only after end', async function () {
    let ended = await this.crowdsale.hasClosed();
    ended.should.equal(false);
    await increaseTimeTo(this.afterClosingTime);
    ended = await this.crowdsale.hasClosed();
    ended.should.equal(true);
  });

  describe('accepting payments', function () {
    it('should reject payments before start', async function () {
      await assertRevert(this.crowdsale.send(value));
      await assertRevert(this.crowdsale.buyTokens(investor, { from: purchaser, value: value }));
    });

    it('should accept payments after start', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.send(value).should.be.fulfilled;
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;
    });

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterClosingTime);
      await assertRevert(this.crowdsale.send(value));
      await assertRevert(this.crowdsale.buyTokens(investor, { value: value, from: purchaser }));
    });
  });
}
