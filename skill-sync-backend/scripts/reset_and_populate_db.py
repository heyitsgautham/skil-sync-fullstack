"""
Script to reset the database and populate it with sample data:
- 3 companies, each with 3 internship roles
- 3 students with different profiles and resumes
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database.connection import engine, SessionLocal, Base
from app.models.user import User, UserRole
from app.models.internship import Internship
from app.models.resume import Resume
from app.models.application import Application
from app.utils.security import get_password_hash
import shutil


def reset_database():
    """Drop all tables and recreate them"""
    print("🗑️  Dropping all tables...")
    Base.metadata.drop_all(bind=engine)

    print("✅ Creating fresh tables...")
    Base.metadata.create_all(bind=engine)

    # Clear resume files
    resume_dir = Path(__file__).parent.parent / "app" / "public" / "resumes"
    if resume_dir.exists():
        shutil.rmtree(resume_dir)
    resume_dir.mkdir(parents=True, exist_ok=True)
    print("✅ Cleared resume directory")


def create_companies(db: Session):
    """Create 3 companies with different profiles"""
    companies_data = [
        {
            "email": "hr@techcorp.com",
            "password": "TechCorp2024",
            "full_name": "TechCorp Solutions",
            "internships": [
                {
                    "title": "Full Stack Software Engineer Intern",
                    "description": "Join our engineering team to build scalable web applications using React, Node.js, and PostgreSQL. Work on real-world projects that impact millions of users.",
                    "required_skills": [
                        "React",
                        "Node.js",
                        "JavaScript",
                        "TypeScript",
                        "PostgreSQL",
                        "REST API",
                        "Git",
                    ],
                    "location": "Bangalore, India",
                    "duration": "6 months",
                    "stipend": "₹40,000/month",
                },
                {
                    "title": "Backend Developer Intern",
                    "description": "Build robust backend services using Python, FastAPI, and microservices architecture. Learn cloud technologies and DevOps practices.",
                    "required_skills": ["Python", "FastAPI", "Django", "PostgreSQL", "Docker", "AWS", "Redis"],
                    "location": "Bangalore, India",
                    "duration": "6 months",
                    "stipend": "₹35,000/month",
                },
                {
                    "title": "Mobile App Developer Intern",
                    "description": "Develop cross-platform mobile applications using React Native. Work on features that enhance user experience on iOS and Android.",
                    "required_skills": ["React Native", "JavaScript", "Mobile Development", "Redux", "REST API"],
                    "location": "Remote",
                    "duration": "4 months",
                    "stipend": "₹30,000/month",
                },
            ],
        },
        {
            "email": "careers@gamestudio.com",
            "password": "GameStudio2024",
            "full_name": "Epic Game Studios",
            "internships": [
                {
                    "title": "Game Developer Intern",
                    "description": "Create immersive gaming experiences using Unity and C#. Work on gameplay mechanics, physics, and AI for our upcoming RPG title.",
                    "required_skills": [
                        "Unity",
                        "C#",
                        "Game Development",
                        "3D Modeling",
                        "Physics Engine",
                        "AI Programming",
                    ],
                    "location": "Hyderabad, India",
                    "duration": "6 months",
                    "stipend": "₹45,000/month",
                },
                {
                    "title": "Graphics Programming Intern",
                    "description": "Optimize rendering pipelines and develop shader programs. Experience with Unreal Engine and graphics programming required.",
                    "required_skills": [
                        "Unreal Engine",
                        "C++",
                        "HLSL",
                        "OpenGL",
                        "DirectX",
                        "Graphics Programming",
                        "Shaders",
                    ],
                    "location": "Hyderabad, India",
                    "duration": "6 months",
                    "stipend": "₹50,000/month",
                },
                {
                    "title": "Game Design Intern",
                    "description": "Design game levels, mechanics, and user experiences. Work with artists and programmers to bring creative visions to life.",
                    "required_skills": [
                        "Game Design",
                        "Unity",
                        "Level Design",
                        "UX Design",
                        "Prototyping",
                        "Playtesting",
                    ],
                    "location": "Hyderabad, India",
                    "duration": "4 months",
                    "stipend": "₹30,000/month",
                },
            ],
        },
        {
            "email": "hiring@blockchainlabs.com",
            "password": "BlockLabs2024",
            "full_name": "Blockchain Labs Inc",
            "internships": [
                {
                    "title": "Blockchain Developer Intern",
                    "description": "Develop smart contracts and decentralized applications (DApps) using Solidity and Web3.js. Work on cutting-edge blockchain solutions.",
                    "required_skills": [
                        "Solidity",
                        "Ethereum",
                        "Web3.js",
                        "Smart Contracts",
                        "Blockchain",
                        "JavaScript",
                        "Truffle",
                    ],
                    "location": "Mumbai, India",
                    "duration": "6 months",
                    "stipend": "₹50,000/month",
                },
                {
                    "title": "DeFi Protocol Engineer Intern",
                    "description": "Build decentralized finance protocols and integrate with various blockchain networks. Experience with DeFi ecosystems preferred.",
                    "required_skills": [
                        "Solidity",
                        "DeFi",
                        "Smart Contracts",
                        "Hardhat",
                        "Ethers.js",
                        "Security Auditing",
                        "Blockchain",
                    ],
                    "location": "Mumbai, India",
                    "duration": "6 months",
                    "stipend": "₹55,000/month",
                },
                {
                    "title": "Crypto Backend Developer Intern",
                    "description": "Develop backend services for cryptocurrency exchanges and wallets. Build APIs for blockchain integration and transaction processing.",
                    "required_skills": [
                        "Python",
                        "Node.js",
                        "Blockchain",
                        "Cryptocurrency",
                        "REST API",
                        "MongoDB",
                        "Redis",
                    ],
                    "location": "Remote",
                    "duration": "5 months",
                    "stipend": "₹40,000/month",
                },
            ],
        },
    ]

    companies = []
    print("\n📦 Creating Companies and Internships...")

    for company_data in companies_data:
        # Create company user
        company = User(
            email=company_data["email"],
            hashed_password=get_password_hash(company_data["password"]),
            full_name=company_data["full_name"],
            role=UserRole.company,
            is_active=1,
        )
        db.add(company)
        db.flush()  # Get the company ID

        print(f"\n✅ Created Company: {company.full_name}")
        print(f"   📧 Email: {company.email}")
        print(f"   🔑 Password: {company_data['password']}")

        # Create internships for this company
        for internship_data in company_data["internships"]:
            internship = Internship(company_id=company.id, **internship_data, is_active=1)
            db.add(internship)
            print(f"   📝 Added Role: {internship_data['title']}")

        companies.append(company)

    db.commit()
    return companies


def create_sample_resumes():
    """Create sample resume files for testing"""
    resume_dir = Path(__file__).parent.parent / "app" / "public" / "resumes"
    resume_dir.mkdir(parents=True, exist_ok=True)

    resumes = {
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

    resume_paths = {}
    for profile, content in resumes.items():
        file_path = resume_dir / f"{profile}_resume.txt"
        with open(file_path, 'w') as f:
            f.write(content)
        resume_paths[profile] = file_path

    return resume_paths


def create_students(db: Session):
    """Create 3 students with different profiles"""

    # First create the resume files
    resume_paths = create_sample_resumes()

    students_data = [
        {
            "email": "alex.kumar@email.com",
            "password": "Alex2024",
            "full_name": "Alex Kumar",
            "profile": "Software Engineer",
            "resume_key": "software_engineer",
            "skills": [
                "React",
                "Node.js",
                "Python",
                "JavaScript",
                "TypeScript",
                "PostgreSQL",
                "MongoDB",
                "FastAPI",
                "Docker",
                "AWS",
                "REST API",
                "Git",
            ],
        },
        {
            "email": "priya.sharma@email.com",
            "password": "Priya2024",
            "full_name": "Priya Sharma",
            "profile": "Game Developer",
            "resume_key": "game_developer",
            "skills": [
                "Unity",
                "C#",
                "Unreal Engine",
                "C++",
                "Game Development",
                "3D Modeling",
                "Blender",
                "Shader Programming",
                "AI Programming",
                "Level Design",
            ],
        },
        {
            "email": "rahul.verma@email.com",
            "password": "Rahul2024",
            "full_name": "Rahul Verma",
            "profile": "Blockchain Developer",
            "resume_key": "blockchain_developer",
            "skills": [
                "Solidity",
                "Ethereum",
                "Web3.js",
                "Smart Contracts",
                "Blockchain",
                "DeFi",
                "Hardhat",
                "Node.js",
                "Python",
                "Cryptocurrency",
                "IPFS",
            ],
        },
    ]

    students = []
    print("\n👥 Creating Students and Resumes...")

    for student_data in students_data:
        # Create student user
        student = User(
            email=student_data["email"],
            hashed_password=get_password_hash(student_data["password"]),
            full_name=student_data["full_name"],
            role=UserRole.student,
            is_active=1,
        )
        db.add(student)
        db.flush()  # Get the student ID

        print(f"\n✅ Created Student: {student.full_name} ({student_data['profile']})")
        print(f"   📧 Email: {student.email}")
        print(f"   🔑 Password: {student_data['password']}")

        # Create resume record
        resume_path = resume_paths[student_data["resume_key"]]
        with open(resume_path, 'r') as f:
            resume_content = f.read()

        resume = Resume(
            student_id=student.id,
            file_path=f"resumes/{resume_path.name}",
            file_name=resume_path.name,
            parsed_content=resume_content,
            extracted_skills=student_data["skills"],
            is_active=1,
        )
        db.add(resume)
        print(f"   📄 Added Resume: {resume_path.name}")
        print(f"   🔧 Skills: {', '.join(student_data['skills'][:5])}...")

        students.append(student)

    db.commit()
    return students


def main():
    """Main function to reset and populate database"""
    print("=" * 70)
    print("🚀 DATABASE RESET AND POPULATION SCRIPT")
    print("=" * 70)

    # Reset database
    reset_database()

    # Create database session
    db = SessionLocal()

    try:
        # Create companies and internships
        companies = create_companies(db)

        # Create students and resumes
        students = create_students(db)

        print("\n" + "=" * 70)
        print("✅ DATABASE POPULATED SUCCESSFULLY!")
        print("=" * 70)

        print("\n📊 SUMMARY:")
        print(f"   • Companies: {len(companies)}")
        print(f"   • Internship Roles: {len(companies) * 3}")
        print(f"   • Students: {len(students)}")
        print(f"   • Resumes: {len(students)}")

        print("\n" + "=" * 70)
        print("🔑 LOGIN CREDENTIALS")
        print("=" * 70)

        print("\n🏢 COMPANIES:")
        print("-" * 70)
        print("1. TechCorp Solutions")
        print("   📧 Email: hr@techcorp.com")
        print("   🔑 Password: TechCorp2024")
        print()
        print("2. Epic Game Studios")
        print("   📧 Email: careers@gamestudio.com")
        print("   🔑 Password: GameStudio2024")
        print()
        print("3. Blockchain Labs Inc")
        print("   📧 Email: hiring@blockchainlabs.com")
        print("   🔑 Password: BlockLabs2024")

        print("\n👥 STUDENTS:")
        print("-" * 70)
        print("1. Alex Kumar (Software Engineer)")
        print("   📧 Email: alex.kumar@email.com")
        print("   🔑 Password: Alex2024")
        print()
        print("2. Priya Sharma (Game Developer)")
        print("   📧 Email: priya.sharma@email.com")
        print("   🔑 Password: Priya2024")
        print()
        print("3. Rahul Verma (Blockchain Developer)")
        print("   📧 Email: rahul.verma@email.com")
        print("   🔑 Password: Rahul2024")

        print("\n" + "=" * 70)
        print("🎉 You can now login with these credentials!")
        print("=" * 70)

    except Exception as e:
        print(f"\n  Error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
