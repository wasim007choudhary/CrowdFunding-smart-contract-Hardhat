const { getNamedAccounts, ethers } = require("hardhat")

let main = async () => {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContractAt("Fundme", deployer)
    console.log("Funding....")
    const txResponse = await fundMe.withdrawfund()
    await txResponse.wait(1)
    console.log("Withdrawl done!")
}
main()
    .then(() => {
        process.exit(0)
    })
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
