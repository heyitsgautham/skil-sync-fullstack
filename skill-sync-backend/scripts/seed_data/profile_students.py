"""Three demo students with full hand-written resumes, one per company's field."""

PROFILE_STUDENTS = [
    {
        'email': 'alex.kumar@email.com',
        'full_name': 'Alex Kumar',
        'profile': 'Software Engineer',
        'resume_key': 'software_engineer',
        'skills': [
            'React',
            'Node.js',
            'Python',
            'JavaScript',
            'TypeScript',
            'PostgreSQL',
            'MongoDB',
            'FastAPI',
            'Docker',
            'AWS',
            'REST API',
            'Git',
        ],
    },
    {
        'email': 'priya.sharma@email.com',
        'full_name': 'Priya Sharma',
        'profile': 'Game Developer',
        'resume_key': 'game_developer',
        'skills': [
            'Unity',
            'C#',
            'Unreal Engine',
            'C++',
            'Game Development',
            '3D Modeling',
            'Blender',
            'Shader Programming',
            'AI Programming',
            'Level Design',
        ],
    },
    {
        'email': 'rahul.verma@email.com',
        'full_name': 'Rahul Verma',
        'profile': 'Blockchain Developer',
        'resume_key': 'blockchain_developer',
        'skills': [
            'Solidity',
            'Ethereum',
            'Web3.js',
            'Smart Contracts',
            'Blockchain',
            'DeFi',
            'Hardhat',
            'Node.js',
            'Python',
            'Cryptocurrency',
            'IPFS',
        ],
    },
]

PROFILE_RESUMES = {
    "software_engineer": """
ALEX KUMAR
Software Engineer
Email: alex.kumar@email.com | Phone: +91-9876543210 | LinkedIn: linkedin.com/in/alexkumar
GitHub: github.com/alexkumar | Location: Bangalore, India

EDUCATION
Bachelor of Technology in Computer Science Engineering
Indian Institute of Technology, Delhi | 2022 - 2026 | CGPA: 8.7/10

TECHNICAL SKILLS
• Languages: Python, JavaScript, TypeScript, Java, C++
• Frontend: React.js, Next.js, HTML5, CSS3, Tailwind CSS, Redux
• Backend: Node.js, Express.js, FastAPI, Django, REST API, GraphQL
• Databases: PostgreSQL, MongoDB, MySQL, Redis
• Tools & Technologies: Git, Docker, AWS, CI/CD, Jest, Postman
• Concepts: Data Structures, Algorithms, OOP, System Design, Agile

PROJECTS
E-Commerce Platform | React, Node.js, PostgreSQL, Stripe
• Built a full-stack e-commerce application with user authentication, product management, and payment integration
• Implemented shopping cart functionality with Redux for state management
• Deployed on AWS with automated CI/CD pipeline using GitHub Actions
• Achieved 95% test coverage using Jest and Supertest

Task Management System | TypeScript, Express, MongoDB
• Developed a collaborative task management application with real-time updates using Socket.io
• Implemented JWT-based authentication and role-based access control
• Created RESTful APIs with comprehensive documentation using Swagger
• Optimized database queries resulting in 40% faster response times

Social Media Analytics Dashboard | Python, FastAPI, React
• Built analytics dashboard for social media metrics using Chart.js and D3.js
• Integrated with Twitter and Instagram APIs for data collection
• Implemented data processing pipeline with Pandas and NumPy
• Used Redis for caching to improve performance by 60%

EXPERIENCE
Software Development Intern | StartupXYZ | Jun 2024 - Aug 2024
• Developed and maintained features for a SaaS product using React and Node.js
• Collaborated with cross-functional teams using Agile methodology
• Fixed critical bugs and improved code quality through code reviews
• Wrote unit tests and integration tests to ensure code reliability

ACHIEVEMENTS
• Won 1st place in college hackathon for developing an AI-powered study assistant
• Contributed to 3 open-source projects with 500+ combined stars on GitHub
• Solved 400+ problems on LeetCode (Rating: 1850)
• Published technical articles on Medium with 10K+ views

CERTIFICATIONS
• AWS Certified Cloud Practitioner
• MongoDB Certified Developer Associate
""",
    "game_developer": """
PRIYA SHARMA
Game Developer
Email: priya.sharma@email.com | Phone: +91-9876543211 | LinkedIn: linkedin.com/in/priyasharma
Portfolio: priyasharma.dev | Location: Hyderabad, India

EDUCATION
Bachelor of Technology in Computer Science
BITS Pilani | 2022 - 2026 | CGPA: 8.5/10
Relevant Coursework: Computer Graphics, Game Development, AI for Games, 3D Modeling

TECHNICAL SKILLS
• Game Engines: Unity, Unreal Engine 5, Godot
• Programming: C#, C++, Python, GDScript
• Graphics: HLSL, GLSL, Shader Programming, OpenGL, DirectX
• 3D Tools: Blender, Maya, Substance Painter
• Game Design: Level Design, Game Mechanics, AI Behavior Trees
• Version Control: Git, Perforce, Plastic SCM
• Other: Physics Engines, Multiplayer Networking, UI/UX Design

PROJECTS
3D RPG Adventure Game | Unity, C#, Blender
• Developed a 3D role-playing game with combat system, inventory management, and quest system
• Implemented AI enemies with behavior trees and pathfinding using A* algorithm
• Created custom shaders for visual effects and optimized rendering pipeline
• Designed and built 15+ game levels with environmental storytelling
• Integrated save/load system with encrypted player data

Multiplayer FPS Game | Unreal Engine 5, C++, Photon
• Built a first-person shooter with real-time multiplayer support for up to 16 players
• Implemented weapon systems, character abilities, and matchmaking
• Optimized network code to reduce latency and improve synchronization
• Created responsive UI/UX with dynamic HUD elements
• Used Lumen for dynamic global illumination and ray tracing

Mobile Puzzle Game | Unity, C#, iOS/Android
• Published a puzzle game on Google Play Store with 50K+ downloads
• Implemented 100+ levels with increasing difficulty and unique mechanics
• Integrated Google Play Services for achievements and leaderboards
• Monetized through ads and in-app purchases
• Maintained 4.5-star rating with regular content updates

EXPERIENCE
Game Development Intern | Indie Game Studio | Jun 2024 - Sep 2024
• Worked on a team developing a 2D platformer game using Unity
• Programmed game mechanics, animations, and player controls
• Collaborated with artists to integrate assets and animations
• Conducted playtesting sessions and implemented feedback
• Optimized game performance for mobile devices

ACHIEVEMENTS
• Won Best Game Award at National Game Jam 2024 (72-hour competition)
• Published 3 games on itch.io with 10K+ combined plays
• Created YouTube tutorials on Unity development with 5K subscribers
• Contributed to open-source Unity asset packages

CERTIFICATIONS
• Unity Certified Programmer
• Unreal Engine 5 C++ Developer
""",
    "blockchain_developer": """
RAHUL VERMA
Blockchain Developer
Email: rahul.verma@email.com | Phone: +91-9876543212 | LinkedIn: linkedin.com/in/rahulverma
GitHub: github.com/rahulverma | Location: Mumbai, India

EDUCATION
Bachelor of Technology in Information Technology
National Institute of Technology, Trichy | 2022 - 2026 | CGPA: 9.0/10
Relevant Coursework: Cryptography, Distributed Systems, Security, Database Systems

TECHNICAL SKILLS
• Blockchain: Ethereum, Hyperledger Fabric, Solana, Polygon, BSC
• Smart Contracts: Solidity, Rust, Vyper
• Web3: Web3.js, Ethers.js, Hardhat, Truffle, Ganache
• Cryptocurrencies: Bitcoin, Ethereum, DeFi Protocols
• Backend: Node.js, Python, FastAPI, Express.js
• Databases: MongoDB, PostgreSQL, IPFS
• Security: Smart Contract Auditing, Penetration Testing
• Tools: Remix IDE, MetaMask, OpenZeppelin, Chainlink

PROJECTS
Decentralized Exchange (DEX) | Solidity, React, Hardhat
• Built a decentralized exchange for token swaps using automated market maker (AMM) model
• Implemented liquidity pools, staking mechanisms, and yield farming
• Developed smart contracts with security best practices and conducted security audits
• Created frontend with Web3.js for wallet integration and transaction handling
• Deployed on Ethereum testnet and Polygon mainnet

NFT Marketplace | Solidity, IPFS, React, Ethers.js
• Developed a full-featured NFT marketplace with minting, buying, and selling functionality
• Stored metadata on IPFS for decentralization and immutability
• Implemented royalty payments and auction mechanisms
• Created admin dashboard for marketplace analytics
• Gas-optimized smart contracts reducing transaction costs by 30%

DeFi Lending Protocol | Solidity, OpenZeppelin, Chainlink
• Built a peer-to-peer lending platform with collateralization and liquidation mechanisms
• Integrated Chainlink oracles for real-time price feeds
• Implemented interest rate models and credit scoring system
• Used OpenZeppelin contracts for security and standard compliance
• Achieved 95% test coverage with unit and integration tests

DAO Governance Platform | Solidity, React, The Graph
• Created a decentralized autonomous organization (DAO) with voting mechanisms
• Implemented proposal creation, voting, and execution of on-chain actions
• Used The Graph for indexing and querying blockchain data efficiently
• Built intuitive UI for DAO members to participate in governance
• Deployed on multiple chains for cross-chain governance

EXPERIENCE
Blockchain Development Intern | CryptoStartup | May 2024 - Aug 2024
• Developed and tested smart contracts for a DeFi protocol
• Audited existing smart contracts and fixed security vulnerabilities
• Integrated blockchain functionality into web applications using Web3.js
• Participated in code reviews and contributed to technical documentation
• Optimized gas costs for contract deployments and transactions

ACHIEVEMENTS
• Won 2nd place in ETHIndia Hackathon 2024 for DeFi innovation
• Contributed to 5+ open-source blockchain projects
• Completed security audit certification from OpenZeppelin
• Published research paper on "Scalability Solutions in Blockchain"
• Active participant in blockchain developer community with 50+ forum contributions

CERTIFICATIONS
• Certified Blockchain Developer - Ethereum
• Smart Contract Security Auditor
• Certified Solidity Developer
""",
}
