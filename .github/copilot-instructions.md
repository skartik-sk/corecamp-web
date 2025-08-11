<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->
- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements - React + TypeScript + Vite project for Camp Network IP marketplace with Origin SDK

- [x] Scaffold the Project

- [x] Set Up Dependencies - Install Origin SDK, Tailwind CSS, React Router, and other required packages using bun

- [x] Configure Providers - Set up CampProvider, QueryClient, and ApolloProvider in main.tsx

- [x] Create Core Components - Header, Footer, Layout with Camp Network branding and navigation

- [x] Implement Pages:
  - [x] Home - Landing page with features, stats, and call-to-action
  - [x] Marketplace - Browse and search IP listings with filters
  - [x] CreateIP - Multi-step IP creation with file upload, metadata, and licensing
  - [x] MyIPs - User's IP portfolio with stats and management
  - [x] IPDetail - Detailed IP view with licensing and purchase options
  - [x] Chat - Negotiation interface for IP licensing discussions
  - [x] Auctions - Auction listings with bidding functionality
  - [x] AuthCallback - Handle OAuth redirects

- [x] Style with Tailwind CSS - Implement Camp Network brand colors and responsive design

- [x] Development Server - Application successfully running on localhost:5173

- [ ] Integrate Origin SDK Features:
  - [ ] User authentication and wallet connection
  - [ ] IP NFT minting functionality
  - [ ] Marketplace transactions
  - [ ] File upload to IPFS/Filecoin
  - [ ] Social account linking

- [ ] Smart Contract Integration:
  - [ ] Connect to Camp Network testnet (Basecamp)
  - [ ] Implement escrow functionality for negotiations
  - [ ] Add auction smart contract interactions
  - [ ] Handle royalty payments and revenue sharing

- [ ] Additional Features:
  - [ ] Real-time chat using WebSocket/Socket.io
  - [ ] Push notifications for bids and messages
  - [ ] Advanced search and filtering
  - [ ] IP analytics and insights
  - [ ] Mobile responsiveness testing

- [ ] Testing & Deployment:
  - [ ] Unit tests for core components
  - [ ] Integration tests for Origin SDK
  - [ ] Deploy to Vercel/Netlify
  - [ ] Configure environment variables for production

- [ ] Documentation & Submission:
  - [ ] Create comprehensive README
  - [ ] Record demo video (2-5 minutes)
  - [ ] Prepare GitHub repository
  - [ ] Draft social media posts for Twitter/X
	<!--
	Ensure that the previous step has been marked as completed.
	Call project setup tool with projectType parameter.
	Run scaffolding command to create project files and folders.
	Use '.' as the working directory.
	If no appropriate projectType is available, search documentation using available tools.
	Otherwise, create the project structure manually using available file creation tools.
	-->

- [ ] Customize the Project
	<!--
	Verify that all previous steps have been completed successfully and you have marked the step as completed.
	Develop a plan to modify codebase according to user requirements.
	Apply modifications using appropriate tools and user-provided references.
	Skip this step for "Hello World" projects.
	-->

- [ ] Install Required Extensions
	<!-- ONLY install extensions provided mentioned in the get_project_setup_info. Skip this step otherwise and mark as completed. -->

- [ ] Compile the Project
	<!--
	Verify that all previous steps have been completed.
	Install any missing dependencies.
	Run diagnostics and resolve any issues.
	Check for markdown files in project folder for relevant instructions on how to do this.
	-->

- [ ] Create and Run Task
	<!--
	Verify that all previous steps have been completed.
	Check https://code.visualstudio.com/docs/debugtest/tasks to determine if the project needs a task. If so, use the create_and_run_task to create and launch a task based on package.json, README.md, and project structure.
	Skip this step otherwise.
	 -->

- [ ] Launch the Project
	<!--
	Verify that all previous steps have been completed.
	Prompt user for debug mode, launch only if confirmed.
	 -->

- [ ] Ensure Documentation is Complete
	<!--
	Verify that all previous steps have been completed.
	Verify that README.md and the copilot-instructions.md file in the .github directory exists and contains current project information.
	Clean up the copilot-instructions.md file in the .github directory by removing all HTML comments.
	 -->
