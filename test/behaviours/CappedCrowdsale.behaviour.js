import assertRevert from '../helpers/assertRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

export default function () {
  let cap;
  let lessThanCap;

  beforeEach(async function () {
    cap = await this.crowdsale.cap();
    lessThanCap = cap.minus(1);
  });

  describe('accepting payments', function () {
    it('should accept payments within cap', async function () {
      await this.crowdsale.send(cap.minus(lessThanCap)).should.be.fulfilled;
      await this.crowdsale.send(lessThanCap).should.be.fulfilled;
    });

    it('should reject payments outside cap', async function () {
      await this.crowdsale.send(cap);
      await assertRevert(this.crowdsale.send(1));
    });

    it('should reject payments that exceed cap', async function () {
      await assertRevert(this.crowdsale.send(cap.plus(1)));
    });
  });

  describe('ending', function () {
    it('should not reach cap if sent under cap', async function () {
      let capReached = await this.crowdsale.capReached();
      capReached.should.equal(false);
      await this.crowdsale.send(lessThanCap);
      capReached = await this.crowdsale.capReached();
      capReached.should.equal(false);
    });

    it('should not reach cap if sent just under cap', async function () {
      await this.crowdsale.send(cap.minus(1));
      let capReached = await this.crowdsale.capReached();
      capReached.should.equal(false);
    });

    it('should reach cap if cap sent', async function () {
      await this.crowdsale.send(cap);
      let capReached = await this.crowdsale.capReached();
      capReached.should.equal(true);
    });
  });
}
