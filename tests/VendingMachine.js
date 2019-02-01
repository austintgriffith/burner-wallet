/* global before  */

const assert = require('assert')
const clevis = require('clevis')
const { expect } = require('chai')
const { BN, hexToUtf8, utf8ToHex } = require('web3').utils

describe('VendingMachine', function() {
  this.timeout(90000);

  let accounts = []
  let machineAddress;

  before(async function() {
    accounts = await clevis('accounts')

    await clevis('compile', 'ERC20Vendable')
    let erc20Tx = await clevis('deploy', 'ERC20Vendable', '0')

    await clevis('compile', 'VendingMachine')
    let vendTx = await clevis('deploy', 'VendingMachine', '0')
    machineAddress = vendTx.contractAddress
  });

  it("should start with a 0 balance", async function () {
    let balance = await clevis('contract', 'totalSupply', 'ERC20Vendable', accounts[0])
    expect(balance, "Should start with 0 balance").to.equal('0');
  })

  it("should start off with no vendingMachine assigned", async function () {
    let vendingMachine = await clevis('contract', 'vendingMachine', 'ERC20Vendable')
    expect(vendingMachine, "Vending machine should be address 0").to.equal('0x0000000000000000000000000000000000000000');
  });

  it("should only allow owner to set Vending Machine", async function () {
    let tx = clevis('contract', 'changeVendingMachine', 'ERC20Vendable', 1, machineAddress)
    await assert.rejects(tx, "Only the onwer should be allowed to set the vendingMachine addr")

    await clevis('contract', 'changeVendingMachine', 'ERC20Vendable', 0, machineAddress)
    let vendingMachine = await clevis('contract', 'vendingMachine', 'ERC20Vendable')

    expect(vendingMachine, "Vending machine should be address 0").to.equal(machineAddress);
  });

  it("should have assigned the correct owner", async function () {
    let owner = await clevis('contract', 'owner', 'ERC20Vendable')
    expect(owner, "Owner should be account 0").to.equal(accounts[0]);
  });

  it("should mint correctly with fallback", async function () {
    const amount = await clevis('fromwei', '1', 'ether')

    await clevis('send', amount, 0, machineAddress)

    return Promise.all([
      clevis('balance', machineAddress, 'wei').then(balance => {
        expect(balance).to.equal('1')
      }),

      clevis('contract', 'balanceOf', 'ERC20Vendable', accounts[0]).then(balance => {
        expect(balance).to.equal('1')
      })
    ]);
  });

  it("should not let a regular user mint", async function() {
    let tx = clevis('contract', 'adminMint', 'VendingMachine', 1, accounts[1], '1')

    await assert.rejects(tx, "Should not let regular user mint")
  });

  it("should let an admin mint", async function() {
    let balanceBefore = await clevis('contract', 'balanceOf', 'ERC20Vendable', accounts[1])
    await clevis('contract', 'adminMint', 'VendingMachine', 0, accounts[1], '1')
    let balanceAfter = await clevis('contract', 'balanceOf', 'ERC20Vendable', accounts[1])

    let difference = new BN(balanceAfter).sub(new BN(balanceBefore))
    expect(difference.toString()).to.equal('1')
  });

  it("should not allow unauthorized withdrawls", async function () {
    let tx = clevis('contract', 'withdraw', 'VendingMachine', 0, 100)
    await assert.rejects(tx, "Should reject this tx")
  });

  it("should allow whitelisted withdrawls", async function () {
    await clevis('contract', 'addWhitelisted', 'VendingMachine', 0, accounts[0])
    let isWhitelisted = await clevis('contract', 'isWhitelisted', 'VendingMachine', accounts[0])
    expect(isWhitelisted).to.equal(true)

    let ercBalance = await clevis('contract', 'balanceOf', 'ERC20Vendable', accounts[0])
    let totalSupplyBefore = await clevis('contract', 'totalSupply', 'ERC20Vendable')

    await clevis('contract', 'withdraw', 'VendingMachine', 0, ercBalance)

    let ercBalanceAfter = await clevis('contract', 'balanceOf', 'ERC20Vendable', accounts[0])
    expect(ercBalanceAfter).to.equal('0')

    let totalSupplyAfter = await clevis('contract', 'totalSupply', 'ERC20Vendable')
    expect(totalSupplyAfter).to.equal(new BN(totalSupplyBefore).sub(new BN(ercBalance)).toString())

    //TODO: Should be testing that the recipient got the correct amount of cash, but gas price with clevis is a pita atm.
  });

  it("should be able to add a Vendor", async function () {
    let tx = clevis('contract', 'addVendor', 'VendingMachine', 1, accounts[1], utf8ToHex('First Vendor'))
    await assert.rejects(tx, "Non-admins shouldn't be able to add vendors")

    await clevis('contract', 'addVendor', 'VendingMachine', 0, accounts[1], utf8ToHex('First Vendor'))
    let vendor = await clevis('contract', 'vendors', 'VendingMachine', accounts[1])
    expect(hexToUtf8(vendor.name)).to.equal('First Vendor');
    expect(vendor.isActive).to.equal(false);
    expect(vendor.isAllowed).to.equal(true);
    expect(vendor.exists).to.equal(true);
  });

  it("should not be able to add the same vendor twice", async function () {
    let tx = clevis('contract', 'addVendor', 'VendingMachine', 0, accounts[1], utf8ToHex('First Vendor Again'))
    await assert.rejects(tx, "Shouldn't be able to add the same vendor account again.")
  });


  //TODO: Things to test:
  //Super admin abilities (add/remove admins, sweep)
  //Admin only stuff (increase allowance, modify vendors)
  //Products
  //Vendor self-updating
  //Events
})
