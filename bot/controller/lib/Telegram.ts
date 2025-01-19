import dotenv from "dotenv";
import { axiosInstance } from "./axios";
import { Contract, RpcProvider } from "starknet";

dotenv.config();

interface TelegramMessage {
  chat: {
    id: number;
  };
  text?: string;
}

const contractAddress =
  "0x0769541b749506a33525e4fef21f9772ef51380a72818c8b88678ef359db16da";

const startMessage = `
🚀 *Welcome to Argonaut Multisig Bot!*

I'm here to help you monitor your Starknet Argonaut multisig wallet transactions.

*/start* - Start a conversation with the bot
📝 */listTxns* - View all transactions with their status
👥 */listSigners* - View all current signers
🔢 */getThreshold* - Check required confirmations
📊 */txStats* - Get transaction statistics
🔍 */txInfo* <txId> - Get detailed info about a specific transaction

Your multisig contract is deployed at:
\`${contractAddress}\`

Get started by trying */listTxns* to see your current transactions!
`;

const helpMessage = `
🤖 *Available Commands:*

🚀 */start* - Start a conversation with the bot
📝 */listTxns* - List all transactions in the multisig wallet
👥 */listSigners* - View all current signers and their addresses
🔢 */getThreshold* - Check current threshold for confirmations
📊 */txStats* - View statistics (pending/executed/total transactions)
🔍 */txInfo* <txId> - Get detailed information about a specific transaction

Example: /txInfo 1 (to get details about transaction #1)

If you need further assistance, feel free to ask!
`;

function sendMessage(messageObj: TelegramMessage, messageText: string) {
  return axiosInstance.get("sendMessage", {
    params: {
      chat_id: messageObj.chat.id,
      text: messageText,
      parse_mode: "Markdown",
    },
  });
}

async function getTransactions() {
  try {
    const provider = new RpcProvider({
      nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno",
    });

    const { abi: contractAbi } = await provider.getClassAt(contractAddress);
    if (contractAbi === undefined) {
      throw new Error("no abi.");
    }
    const contract = new Contract(contractAbi, contractAddress, provider);

    const signersResult = await contract.get_signers();
    const hexSigners = signersResult.map(
      (signer: bigint) => "0x" + signer.toString(16).padStart(64, "0")
    );

    const txLen = await contract.get_transactions_len();
    const threshold = await contract.get_threshold();

    let message = "🔐 *Multisig Wallet Transactions*\n\n";
    message += `📊 *Total Transactions:* ${txLen.toString()}\n`;
    message += `✅ *Required Confirmations:* ${threshold.toString()}\n\n`;

    // Fetch all transactions
    for (let i = 0; i < Number(txLen.toString()); i++) {
      const tx = await contract.get_transaction(i);
      const isExecuted = await contract.is_executed(i);

      const receiverHex =
        tx[1] && tx[1][0]
          ? "0x" + BigInt(tx[1][0]).toString(16).padStart(64, "0")
          : "0x" + BigInt(tx[0].to).toString(16).padStart(64, "0");

      const amountLow = tx[1] && tx[1][1] ? BigInt(tx[1][1]) : BigInt(0);
      const amountHigh = tx[1] && tx[1][2] ? BigInt(tx[1][2]) : BigInt(0);
      const amount = ((amountHigh << BigInt(128)) + amountLow).toString();
      const ethAmount = Number(amount) / 1e18;

      message += `🔹 *Transaction #${i}*\n`;
      message += `To: \`${receiverHex}\`\n`;
      message += `Amount: ${ethAmount.toFixed(4)} ETH\n`;
      message += `Confirmations: ${
        tx[0].confirmations
      }/${threshold.toString()}\n`;
      message += `Status: ${
        Number(isExecuted) === 1 ? "✅ Executed" : "⏳ Pending"
      }\n\n`;
    }

    return message;
  } catch (error: any) {
    return `❌ Error fetching transactions: ${error.message}`;
  }
}

async function getSigners() {
  try {
    const provider = new RpcProvider({
      nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno",
    });

    const { abi: contractAbi } = await provider.getClassAt(contractAddress);
    if (contractAbi === undefined) {
      throw new Error("no abi.");
    }
    const contract = new Contract(contractAbi, contractAddress, provider);

    const signersResult = await contract.get_signers();
    const threshold = await contract.get_threshold();

    let message = "👥 *Current Multisig Signers*\n\n";
    message += `✅ *Required Confirmations:* ${threshold.toString()}\n\n`;

    signersResult.forEach((signer: bigint, index: number) => {
      const hexAddress = "0x" + signer.toString(16).padStart(64, "0");
      message += `${index + 1}. \`${hexAddress}\`\n`;
    });

    return message;
  } catch (error: any) {
    return `❌ Error fetching signers: ${error.message}`;
  }
}

async function getTransactionStats() {
  try {
    const provider = new RpcProvider({
      nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno",
    });

    const { abi: contractAbi } = await provider.getClassAt(contractAddress);
    if (contractAbi === undefined) {
      throw new Error("no abi.");
    }
    const contract = new Contract(contractAbi, contractAddress, provider);

    const txLen = await contract.get_transactions_len();
    let executed = 0;
    let pending = 0;

    for (let i = 0; i < Number(txLen.toString()); i++) {
      const isExecuted = await contract.is_executed(i);
      if (Number(isExecuted) === 1) {
        executed++;
      } else {
        pending++;
      }
    }

    let message = "📊 *Transaction Statistics*\n\n";
    message += `📈 *Total Transactions:* ${txLen.toString()}\n`;
    message += `✅ *Executed:* ${executed}\n`;
    message += `⏳ *Pending:* ${pending}\n`;

    return message;
  } catch (error: any) {
    return `❌ Error fetching transaction stats: ${error.message}`;
  }
}

async function getTransactionInfo(txId: string) {
  try {
    const provider = new RpcProvider({
      nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno",
    });

    const { abi: contractAbi } = await provider.getClassAt(contractAddress);
    if (contractAbi === undefined) {
      throw new Error("no abi.");
    }
    const contract = new Contract(contractAbi, contractAddress, provider);

    const tx = await contract.get_transaction(Number(txId));
    const isExecuted = await contract.is_executed(Number(txId));
    const threshold = await contract.get_threshold();

    const receiverHex =
      tx[1] && tx[1][0]
        ? "0x" + BigInt(tx[1][0]).toString(16).padStart(64, "0")
        : "0x" + BigInt(tx[0].to).toString(16).padStart(64, "0");

    const amountLow = tx[1] && tx[1][1] ? BigInt(tx[1][1]) : BigInt(0);
    const amountHigh = tx[1] && tx[1][2] ? BigInt(tx[1][2]) : BigInt(0);
    const amount = ((amountHigh << BigInt(128)) + amountLow).toString();
    const ethAmount = Number(amount) / 1e18;

    let message = `🔍 *Transaction #${txId} Details*\n\n`;
    message += `📍 *To:* \`${receiverHex}\`\n`;
    message += `💰 *Amount:* ${ethAmount.toFixed(4)} ETH\n`;
    message += `✋ *Confirmations:* ${
      tx[0].confirmations
    }/${threshold.toString()}\n`;
    message += `📌 *Status:* ${
      Number(isExecuted) === 1 ? "✅ Executed" : "⏳ Pending"
    }\n`;

    return message;
  } catch (error: any) {
    return `❌ Error fetching transaction info: ${error.message}`;
  }
}

async function handleMessage(messageObj: TelegramMessage) {
  const cmd = messageObj.text || "";
  const [command, ...args] = cmd.split(" ");

  if (command === "/start") {
    return sendMessage(messageObj, startMessage);
  } else if (command === "/help") {
    return sendMessage(messageObj, helpMessage);
  } else if (command === "/listTxns") {
    const txns = await getTransactions();
    return sendMessage(messageObj, txns);
  } else if (command === "/listSigners") {
    const signers = await getSigners();
    return sendMessage(messageObj, signers);
  } else if (command === "/txStats") {
    const stats = await getTransactionStats();
    return sendMessage(messageObj, stats);
  } else if (command === "/txInfo" && args[0]) {
    const info = await getTransactionInfo(args[0]);
    return sendMessage(messageObj, info);
  } else if (command === "/getThreshold") {
    const provider = new RpcProvider({
      nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno",
    });
    const { abi: contractAbi } = await provider.getClassAt(contractAddress);
    const contract = new Contract(contractAbi, contractAddress, provider);
    const threshold = await contract.get_threshold();
    return sendMessage(
      messageObj,
      `🔢 *Required Confirmations:* ${threshold.toString()}`
    );
  }
}

export { handleMessage };
