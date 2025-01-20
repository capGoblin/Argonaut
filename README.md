# 🚀 **Argonaut**: Turning Telegram groups into fully functional multisig wallets on Starknet.

## 🌟 **Project Overview**  
Argonaut is a Telegram-based multisig wallet solution powered by Starknet, designed to simplify decentralized treasury management. It combines the familiarity of Telegram with the security and transparency of blockchain. Through Argonaut, users can propose, approve, revoke confirmations, and execute multisig transactions directly from their Telegram group. This makes group fund management seamless, accessible, and secure.

The name **Argonaut** is inspired by the legendary Greek adventurers, the Argonauts, who sailed with Jason aboard the ship Argo in search of the Golden Fleece. This symbolizes teamwork and collaboration, much like how Argonaut enables groups to securely manage decentralized funds together.

## 📈 **Key Features**

**Comprehensive Command Suite:**  
- 📝 **/listTxns**: View all transactions with their status.  
- 👥 **/listSigners**: View current wallet signers.  
- 🔢 **/getThreshold**: Check the number of approvals required.  
- 📊 **/txStats**: Get transaction statistics for analytics.  
- 🔍 **/txInfo <txId>**: Fetch detailed info about specific transactions.

**Interactive Mini App in Telegram:**  
- Submit transactions with a simple interface.  
- Use selectors for key actions like submit_transaction, confirm_transaction, execute_transaction, and revoke_confirmation.

**Argent Telegram Wallet Integration:**  
- Utilizes ArgentTMA SDK for wallet interactions, enabling secure multisig operations.

**Starknet-Powered Multisig Contract:**  
- Transparent and decentralized management of funds.

**Analytics and Transparency:**  
- View transaction stats and signer activities directly via Telegram bot.

## 🏋️ **Explain Your Features**

**Telegram-Based Workflow:**  
- Users interact through intuitive commands and a mini-app in Telegram.

**Secure Multisig Wallet:**  
- Requires multiple signer approvals, ensuring no single point of failure.

**Seamless Interactions:**  
- Mini-app simplifies transaction submissions, confirmations, and revocations.

**Decentralized Transparency:**  
- All actions are recorded on Starknet, providing verifiable records.

**User-Friendly Tools:**  
- Commands like /listTxns and /txInfo provide quick overviews and details.

## 📦 **Tech Stack**

**Frontend:**  
- **Telegram Mini App**: Enables users to interact with the wallet through an intuitive interface.  
- **Argent Telegram Wallet**: Integrated using the ArgentTMA SDK for managing multisig transactions.

**Backend:**  
- **Node.js**: Manages commands, interactions, and Starknet integrations.  
- **Starknet.js**: Interfaces with the Argonaut multisig contract for transaction management.

**APIs:**  
- **Starknet RPC APIs**: Used to interact with the on-chain multisig wallet contract.  
- **Telegram Bot API**: Handles group chat interactions and bot commands.

## 🛠️ **How It Works**

**Submit a Transaction:**  
- Use the Telegram mini-app to propose a transaction.  
- The bot submits the transaction to the Starknet multisig contract.

**Approve/Reject:**  
- Group members confirm the transaction and also revoke their confirmation before the transaction is executed.  
- Approval statuses are updated in real-time in the Telegram bot.

**Execution:**  
- When the required threshold is met (e.g., 2/2 approvals), users execute the transaction.

**Track Activity:**  
- Use commands like /listTxns and /txStats to view the wallet’s activity and analytics.

## 📌 **Technicals**

**Argonaut Multisig Contract:**  
- Written in Cairo for Starknet, it supports transaction proposals, confirmations, revocations, and executions.

**Telegram Mini-App:**  
- A custom-designed interface for easy interaction with the wallet, supporting selectors like submit_transaction, confirm_transaction, execute_transaction, and revoke_confirmation.

**ArgentTMA SDK:**  
- Facilitates wallet actions like signing transactions and tracking execution through Telegram.

**Transaction Workflow:**  
- Propose → Confirm/Revoke → Execute.  
- Each step involves direct interactions with the Starknet contract via Starknet.js.

## ✅ **Why Your Submission?**  
Argonaut stands out by turning Telegram groups into a secure, user-friendly platform for multisig wallet management with Argent Telegram wallet. It eliminates the need for external apps or interfaces, making it highly accessible. By leveraging Starknet for low-cost, scalable transactions, it ensures security and efficiency, while its Telegram-first approach brings Web3 functionality to a familiar environment.

## 📅 **Project Future**

- **AI Integration**: Introduce AI to suggest approvals, flag suspicious transactions, and provide predictive analytics.  
- **Advanced Wallet Features**: Support for DeFi integrations (staking, lending) and token swaps.

## 🤝 **Team & Contributions**

🧑‍💻 **Dharshan**: Designed and developed the Telegram bot, implemented the Starknet multisig contract, and integrated the ArgentTMA SDK.  
**My Handles:**  
- [GitHub](https://github.com/capGoblin/)  
- [Telegram](https://t.me/capGoblin)  
- [Email](mailto:dharshan2457@gmail.com)

## 📹 **Video Recording:**

[Watch the Demo Video here](https://youtu.be/l6YgXGNO1oQ)

**Contract Address and Signers Interacted in Video:**  
- **Contract Address**: [View Contract on Sepolia Voyager](https://sepolia.voyager.online/contract/0x021a9763bc727b5cb431364acadbaa76b6c616b80d08713ae194a83eed78de4e)  
- **Signers:**  
  - [Signer 1](https://sepolia.voyager.online/contract/0x0796DBE51f8A436621f7a12F19FEB9C01d9314d92660d132c560dF7483eC4913)  
  - [Signer 2](https://sepolia.voyager.online/contract/0x01BA9Fed9DE5545D2e90A4a9A165c16994A2FF3dcc5EDE8f4F72D87413767BF3)
