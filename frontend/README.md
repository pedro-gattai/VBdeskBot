# VB Desk - Private OTC trading for everyone! 🗳️

This project provides a user interface for private Over-The-Counter (OTC) trading.

## Setup Instructions

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd frontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure environment variables:**

    *   Create a `.env` file in the root directory.
    *   Add the necessary environment variables (e.g., API keys, network configurations).  Example:

        ```
        VITE_API_URL=your_api_endpoint
        VITE_NETWORK=mainnet
        ```

4.  **Start the development server:**

    ```bash
    npm run dev
    ```

    This will start the application in development mode, usually at `http://localhost:5173`.

## Feature Overview

*   **Wallet Connection:**  Connect to your preferred Web3 wallet (e.g., MetaMask, WalletConnect).
*   **Auction Creation:**  Create new OTC trading auctions with specific terms.
*   **Bidding:**  Participate in auctions by placing bids.
*   **Reveal:**  Reveal your trade after the auction ends.
*   **Auction Listing:**  Browse and filter available auctions.

## Technology Stack

*   React
*   TypeScript
*   Vite
*   [Add any other relevant libraries/frameworks here]

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
