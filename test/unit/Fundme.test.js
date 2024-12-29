const { deployments, getNamedAccounts, ethers } = require("hardhat")
const { assert } = require("chai")
const { expect } = require("chai")
const { TransactionReceipt } = require("ethers")
const { developmentChains } = require("../../helper-hardhat-config")
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Fundme", function () {
          let fundMe
          let mockV3Aggregator
          let deployer
          let sendvalue = ethers.utils.parseEther("1").toString()

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer

              // Deploy all contracts including mocks
              await deployments.fixture(["all"])

              // Get the deployed contracts
              fundMe = await deployments.get("Fundme") // Use deployments.get for deployed contracts
              mockV3Aggregator = await deployments.get("MockV3Aggregator") // Use deployments.get for deployed contracts

              // Attach ethers to the deployed contract
              fundMe = await ethers.getContractAt("Fundme", fundMe.address) // Get contract instance
              mockV3Aggregator = await ethers.getContractAt(
                  "MockV3Aggregator",
                  mockV3Aggregator.address,
              ) // Get contract instance
          })

          describe("constructor", function () {
              it("sets the aggregator address correctly", async () => {
                  // Check if the price feed address in the FundMe contract is correct
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })
          describe("receive", function () {
              it("accepts ether and updates the balance", async () => {
                  // Convert 1 ETH to wei (BigNumber)
                  const sendValue = ethers.utils.parseEther("1").toString()

                  // Get the deployer's signer (await is required)
                  const deployerSigner = await ethers.getSigner(deployer)

                  // Send Ether directly to the contract
                  const tx = await deployerSigner.sendTransaction({
                      to: fundMe.address,
                      value: sendValue, // Pass BigNumber directly
                  })
                  await tx.wait() // Wait for the transaction to be mined

                  // Check the contract balance (BigNumber)
                  const contractBalance = (
                      await ethers.provider.getBalance(fundMe.address)
                  ).toString()

                  // Assert the contract balance matches the sent value
                  assert.equal(contractBalance, sendValue)
              })
          })
          describe("fallback", function () {
              it("accpets ether even if no function or invalid function is called", async () => {
                  const sendvalue = ethers.utils.parseEther("1").toString()
                  const deploysign = await ethers.getSigner(deployer)
                  const invalidfunc = ethers.utils.id("hey()").slice(0, 10)
                  const tx = await deploysign.sendTransaction({
                      to: fundMe.address,
                      value: sendvalue,
                      // data: "0x",// invalid function signature for (empty data 0x)
                      //data: ethers.utils.id("hey()").slice(0,10) // invalid function signature data
                      data: invalidfunc, // orn define the inalid func before store it in a varialbe. all three works
                  })
                  await tx.wait()
                  const balance = (
                      await ethers.provider.getBalance(fundMe.address)
                  ).toString()
                  assert.equal(balance, sendvalue)
              })
          })
          describe("sendfund", () => {
              it("fails if you don't send enough eth", async () => {
                  await expect(fundMe.sendfund()).to.be.reverted
              })
              it("shows amount funded by the address", async () => {
                  await fundMe.sendfund({ value: sendvalue })
                  const response = (
                      await fundMe.getAddresstoAmountsent(deployer)
                  ).toString()

                  assert.equal(response, sendvalue)
              })
              it("Adds funder to the array of funders", async () => {
                  await fundMe.sendfund({ value: sendvalue })
                  const funders = await fundMe.getSender(0)
                  assert.equal(funders, deployer)
              })
          })
          describe("withdrawfund", () => {
              beforeEach(async () => {
                  await fundMe.sendfund({ value: sendvalue })
              })
              it("withdraw eth from a single founder", async () => {
                  //Arrange
                  const startingfundmebalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingdeployerbalance =
                      await fundMe.provider.getBalance(deployer)
                  //Act
                  const transactionresponse = await fundMe.withdrawfund()
                  const transactionreceipt = await transactionresponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionreceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingfundmebalance = await fundMe.provider.getBalance(
                      fundMe.address,
                  )
                  const endingdeployerbalance =
                      await fundMe.provider.getBalance(deployer)

                  //assert
                  assert.equal(endingfundmebalance, 0)
                  assert.equal(
                      startingfundmebalance
                          .add(startingdeployerbalance)
                          .toString(),
                      endingdeployerbalance.add(gasCost).toString(),
                  )
              })
              it("allows us to withdraw with multiple funders", async () => {
                  //Arrange

                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundmeconnectedcontract = await fundMe.connect(
                          accounts[i],
                      )
                      await fundmeconnectedcontract.sendfund({
                          value: sendvalue,
                      })
                  }
                  const startingfundmebalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingdeployerbalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.withdrawfund()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingfundmebalance = await fundMe.provider.getBalance(
                      fundMe.address,
                  )
                  const endingdeployerbalance =
                      await fundMe.provider.getBalance(deployer)
                  //assert
                  assert.equal(endingfundmebalance, 0)
                  assert.equal(
                      startingfundmebalance
                          .add(startingdeployerbalance)
                          .toString(),
                      endingdeployerbalance.add(gasCost).toString(),
                  )

                  //make sure the getSender are reset
                  await expect(fundMe.getSender(0)).to.be.reverted
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddresstoAmountsent(
                              accounts[i].address,
                          ),
                          0,
                      )
                  }
              })
              it("only allows the owner to withdraw funds", async () => {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]

                  // Connect the attacker to the contract
                  const attackerconnectedcontract =
                      await fundMe.connect(attacker)

                  // Expect the attacker to be reverted with the custom error
                  await expect(
                      attackerconnectedcontract.withdrawfund(),
                  ).to.be.rejectedWith(
                      fundMe, // Contract instance here
                      "Fundme__NotOwner", // Name of the custom error
                  )
              })
              it("cheaper withdraw testing......", async () => {
                  //Arrange

                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundmeconnectedcontract = await fundMe.connect(
                          accounts[i],
                      )
                      await fundmeconnectedcontract.sendfund({
                          value: sendvalue,
                      })
                  }
                  const startingfundmebalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingdeployerbalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.cheaperwithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingfundmebalance = await fundMe.provider.getBalance(
                      fundMe.address,
                  )
                  const endingdeployerbalance =
                      await fundMe.provider.getBalance(deployer)
                  //assert
                  assert.equal(endingfundmebalance, 0)
                  assert.equal(
                      startingfundmebalance
                          .add(startingdeployerbalance)
                          .toString(),
                      endingdeployerbalance.add(gasCost).toString(),
                  )

                  //make sure the getSender are reset
                  await expect(fundMe.getSender(0)).to.be.reverted
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddresstoAmountsent(
                              accounts[i].address,
                          ),
                          0,
                      )
                  }
              })
          })
      })
