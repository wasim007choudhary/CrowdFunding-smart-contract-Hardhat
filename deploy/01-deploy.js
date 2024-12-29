const { networkconfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utills/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //if chainId is X use address Y
    //if chainId is 2 use address A

    // const ethUsdPriceFeedAddress = networkconfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        //const ethUsdAggregator = await deployments.get("MockV3Agg") // or
        const ethUsdAggregator = await get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkconfig[chainId]["ethUsdPriceFeed"]
    }
    const args = [ethUsdPriceFeedAddress]
    const fundme = await deploy("Fundme", {
        from: deployer,
        args: args, // put price feed address here

        log: true,
        waitConfirtmations: network.config.blockConfirmations || 5,
    })
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundme.address, args)
    }
    log(
        "----------------------------------------------------------------------",
    )
}
module.exports.tags = ["all", "fundme"]
