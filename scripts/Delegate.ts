import { createPublicClient, http, createWalletClient, formatEther, toHex, hexToString } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { abi, bytecode } from "../artifacts/contracts/Ballot.sol/Ballot.json";
import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.SEPOLIA_RPC_URL || "";
const callerPrivateKey = process.env.PRIVATE_KEY_2 || "";

async function main() {
    const parameters = process.argv.slice(2);
    if (!parameters || parameters.length < 2)
        throw new Error("Parameters not provided");
    const contractAddress = parameters[0] as `0x${string}`;
    if (!contractAddress) throw new Error("Contract address not provided");
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress))
        throw new Error("Invalid contract address");
    
        
    const voterAddress = parameters[1] as `0x${string}`;
    if (!voterAddress) throw new Error("Contract address not provided");
    if (!/^0x[a-fA-F0-9]{40}$/.test(voterAddress))
        throw new Error("Invalid contract address");
    console.log("contractAddress: " + contractAddress + " vote: " + voterAddress);

    const publicClient = createPublicClient({
            chain: sepolia,
            transport: http(url),
    });
    const blockNumber = await publicClient.getBlockNumber();
    console.log("Last block number:", blockNumber);

    const account = privateKeyToAccount(`0x${callerPrivateKey}`);
    const caller = createWalletClient({
        account,
        chain: sepolia,
        transport: http(url),
    });
    console.log("caller address:", caller.account.address);
    const balance = await publicClient.getBalance({
        address: caller.account.address,
    });
    
    console.log(
        "caller balance:",
        formatEther(balance),
        caller.chain.nativeCurrency.symbol
    );

    console.log("Voter To Delegate To: "+voterAddress);
    console.log("Confirm? (Y/n)");

    const stdin = process.openStdin();
    stdin.addListener("data", async function (d) {
    if (d.toString().trim().toLowerCase() != "n") {
      const hash = await caller.writeContract({
        address: contractAddress,
        abi,
        functionName: "delegate",
        args: [voterAddress],
      });
      console.log("Transaction hash:", hash);
      console.log("Waiting for confirmations...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Transaction confirmed");
    } else {
      console.log("Operation cancelled");
    }
    process.exit();
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});