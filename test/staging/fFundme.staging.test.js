const { ethers, network, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

console.log("developmentChains:", developmentChains)
console.log("running on network: " + network.name)
if (!network || !network.name) {
    throw new Error("Network configuration is missing or invalid.")
}

if (developmentChains.includes(network.name)) {
    console.log("Skipping tests for development chain...")
} else {
    console.log("Running tests for live network...")
    describe("Fundme", function () {
        let fundMe
        let deployer

        const sendValue = ethers.utils.parseEther("0.02") // 0.02 ETH

        beforeEach("Fundme", async () => {
            try {
                const accounts = await ethers.getSigners()
                deployer = accounts[0]

                const fundMeDeploy = await deployments.get("Fundme")
                fundMe = await ethers.getContractAt(
                    fundMeDeploy.abi,
                    fundMeDeploy.address,
                    deployer,
                )
            } catch (error) {
                console.error("Error in beforeEach:", error)
                console.error(error.stack)
                throw error // Ensure the error is propagated.
            }
        })

        it("Allows people to fund and withdraw", async () => {
            try {
                console.log("Funding contract")
                await fundMe.sendfund({ value: sendValue })

                console.log("Withdrawing funds")
                await fundMe.withdrawfund()

                console.log("Checking ending balance")
                const endingBalance = await ethers.provider.getBalance(
                    fundMe.address,
                )
                console.log("Ending balance:", endingBalance.toString())
                assert.equal(endingBalance.toString(), "0")
            } catch (error) {
                console.error("Error in test:", error)
                throw error // Propagate the error
            }
        })
    })
}
