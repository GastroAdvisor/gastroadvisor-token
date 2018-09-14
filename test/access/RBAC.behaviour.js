const expectEvent = require('../helpers/expectEvent');
const { assertRevert } = require('../helpers/assertRevert');

require('chai')
  .use(require('chai-as-promised'))
  .should();

function shouldBehaveLikeRBAC ([owner, minter, futureMinter, anotherFutureMinter, thirdParty]) {
  context('test RBAC functions', function () {
    describe('in normal conditions', function () {
      it('allows owner to add a minter', async function () {
        await this.instance.addMinter(futureMinter, { from: owner }).should.be.fulfilled;
      });

      it('allows owner to add a minters', async function () {
        await this.instance.addMinters([futureMinter, anotherFutureMinter], { from: owner }).should.be.fulfilled;
      });

      it('allows owner to remove a minter', async function () {
        await this.instance.addMinter(futureMinter, { from: owner }).should.be.fulfilled;
        await this.instance.removeMinter(futureMinter, { from: owner }).should.be.fulfilled;
      });

      it('announces a RoleAdded event on addRole', async function () {
        await expectEvent.inTransaction(
          this.instance.addMinter(futureMinter, { from: owner }),
          'RoleAdded'
        );
      });

      it('announces a RoleRemoved event on removeRole', async function () {
        await expectEvent.inTransaction(
          this.instance.removeMinter(minter, { from: owner }),
          'RoleRemoved'
        );
      });
    });

    describe('in adversarial conditions', function () {
      it('does not allow owner to add an empty array of minters', async function () {
        await assertRevert(
          this.instance.addMinters([], { from: owner })
        );
      });

      it('does not allow "thirdParty" except owner to add minters', async function () {
        await assertRevert(
          this.instance.addMinter(futureMinter, { from: minter })
        );
        await assertRevert(
          this.instance.addMinter(futureMinter, { from: thirdParty })
        );

        await assertRevert(
          this.instance.addMinters([futureMinter, anotherFutureMinter], { from: minter })
        );
        await assertRevert(
          this.instance.addMinters([futureMinter, anotherFutureMinter], { from: thirdParty })
        );
      });

      it('does not allow "thirdParty" except owner to remove a minter', async function () {
        await this.instance.addMinter(futureMinter, { from: owner }).should.be.fulfilled;
        await assertRevert(
          this.instance.removeMinter(futureMinter, { from: minter })
        );
        await assertRevert(
          this.instance.removeMinter(futureMinter, { from: thirdParty })
        );
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeRBAC,
};
