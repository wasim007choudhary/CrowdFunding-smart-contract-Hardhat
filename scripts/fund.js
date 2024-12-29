const { getNamedAccounts, ethers } = require("hardhat")

let main = async () => {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContractAt("Fundme", deployer)
    console.log("Funding contract....")
    const transactionResponse = await fundMe.sendfund({
        value: ethers.utils.parseEther("0.1"),
    })
    await transactionResponse.wait(1)
    console.log("FUNDED")
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
