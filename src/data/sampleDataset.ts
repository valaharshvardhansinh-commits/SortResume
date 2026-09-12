import { JobDescription, CandidateResume, JDBiasIssue } from '../types';

export const SAMPLE_JD_RAW = `Company: TechNova Solutions
Position: Junior Full Stack Developer Intern (Summer 2026)
Location: Bangalore, India / Hybrid (Open to Manipal University Campus Placements)
Duration: 6 Months (Convertible to Full-Time)

About TechNova Solutions:
TechNova Solutions is a fast-growing cloud software provider building next-generation developer tooling and collaborative workflow platforms. We are seeking an exceptional Junior Full Stack Developer Intern to join our core engineering crew.

Role & Core Responsibilities:
- Build responsive, accessible, and high-performance user interfaces using modern web frameworks (React.js).
- Design, implement, and document secure RESTful APIs using Node.js and Express.
- Model database schemas and perform efficient queries using NoSQL (MongoDB) or relational databases (PostgreSQL).
- Collaborate with engineering peers using Git version control, conducting peer code reviews and participating in agile sprints.
- Write modular, testable code and assist with basic containerization (Docker) and deployment pipelines.

Requirements & Qualifications:
- Currently pursuing a Bachelor's or Master's in Computer Science, Information Technology, or equivalent STEM discipline.
- Strong hands-on proficiency in JavaScript / ES6+ and React.
- Solid server-side understanding of Node.js, Express, and building REST APIs.
- Experience with database systems (MongoDB or PostgreSQL).
- Familiarity with version control using Git and GitHub.
- Good-to-have: Familiarity with TypeScript, Docker, Tailwind CSS, or CI/CD pipelines.

Additional Candidate Profile Constraints:
- Note: Must strictly be from Tier-1 institutions (IIT, NIT, BITS, MIT Manipal) with a minimum 8.5 CGPA.
- Looking for a young, aggressive coding ninja or rockstar ready to hustle 24/7 and crush high-pressure sprint goals.
- Requires 2+ years of production experience in React 19 and Node.js for this internship.
- Must work exclusively on Linux/Ubuntu environments with custom Neovim configurations.`;

export const SAMPLE_JD_BIASES: JDBiasIssue[] = [
  {
    id: 'bias-1',
    category: 'exclusionary_credentials',
    phrase: 'Must strictly be from Tier-1 institutions (IIT, NIT, BITS, MIT Manipal) with a minimum 8.5 CGPA',
    severity: 'high',
    explanation: 'Institutional elitism and rigid CGPA filtering unfairly exclude high-performing self-taught engineers, tier-2/3 college talent, and candidates with strong practical portfolios.',
    recommendation: 'Replace with: "Open to candidates from any accredited degree program or self-taught developers with demonstrated project portfolios."'
  },
  {
    id: 'bias-2',
    category: 'gendered_or_aggressive',
    phrase: 'young, aggressive coding ninja or rockstar ready to hustle 24/7',
    severity: 'high',
    explanation: 'Gender-coded, aggressive language ("ninja", "rockstar", "hustle 24/7") is scientifically proven to reduce female and non-binary applicant rates, while signaling an unhealthy work-life balance.',
    recommendation: 'Replace with: "Passionate and collaborative full-stack developer committed to continuous learning and high-quality software craftsmanship."'
  },
  {
    id: 'bias-3',
    category: 'experience_inflation',
    phrase: 'Requires 2+ years of production experience in React 19 and Node.js for this internship',
    severity: 'high',
    explanation: 'Demanding multi-year production experience for a student internship role is unrealistic, especially referencing recent versions (React 19), discouraging qualified students who built substantial academic/personal projects.',
    recommendation: 'Replace with: "Hands-on project experience with modern React and Node.js through internships, coursework, or open-source contributions."'
  },
  {
    id: 'bias-4',
    category: 'rigid_tooling',
    phrase: 'Must work exclusively on Linux/Ubuntu environments with custom Neovim configurations',
    severity: 'medium',
    explanation: 'Arbitrary editor and OS requirements do not measure engineering capability and add unnecessary gatekeeping for Windows or macOS developers.',
    recommendation: 'Replace with: "Comfortable developing in standard modern IDEs and Unix-like terminal environments."'
  }
];

export const SAMPLE_JOB_DESCRIPTION: JobDescription = {
  id: 'jd-technova-01',
  title: 'Junior Full Stack Developer Intern',
  company: 'TechNova Solutions',
  location: 'Bangalore, India (Campus Placement)',
  experienceLevel: 'Student / Intern (0-1 Years)',
  rawText: SAMPLE_JD_RAW,
  requiredHardSkills: [
    'React',
    'Node.js',
    'Express',
    'JavaScript',
    'REST APIs',
    'MongoDB',
    'Git'
  ],
  goodToHaveSkills: [
    'TypeScript',
    'PostgreSQL',
    'Docker',
    'Tailwind CSS',
    'CI/CD'
  ],
  coreResponsibilities: [
    'Build responsive user interfaces using React.js and modern state management',
    'Design and maintain secure RESTful microservices with Node.js and Express',
    'Schema design and data access with MongoDB / PostgreSQL',
    'Collaborate in agile team workflows with Git, PR reviews, and sprint planning',
    'Unit testing, containerization with Docker, and clean code documentation'
  ],
  educationRequirements: [
    'B.Tech / B.E. / M.C.A. in Computer Science, Information Technology, or relevant discipline'
  ],
  detectedBiases: SAMPLE_JD_BIASES
};

export const SAMPLE_RESUMES: CandidateResume[] = [
  {
    id: 'res-01',
    candidateName: 'Aarav Sharma',
    email: 'aarav.sharma@example.edu',
    phone: '+91 98765 43210',
    education: 'B.Tech in Computer Science, Manipal Institute of Technology (2022-2026), CGPA: 8.9',
    experienceSummary: 'Full-stack developer with 6 months prior internship at DevSprint. Architected RESTful microservices in Node.js and Express handling 15,000 daily API requests with MongoDB indexing and Redis caching. Developed rich dynamic frontends in React.js with Tailwind CSS.',
    extractedSkills: ['React', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'JavaScript', 'REST APIs', 'Git', 'Docker', 'Tailwind CSS', 'Redis'],
    projects: [
      'CampusCart: MERN stack e-commerce web platform with JWT authentication, Stripe payment gateway, and MongoDB database models.',
      'DevCollab: Real-time code sharing tool using Express, Socket.io, and React frontend containerized using Docker.'
    ],
    rawText: `AARAV SHARMA
Email: aarav.sharma@example.edu | Phone: +91 98765 43210
B.Tech Computer Science - MIT Manipal (2022-2026) | CGPA: 8.9

TECHNICAL SKILLS:
Languages & Frameworks: JavaScript (ES6+), TypeScript, React.js, Node.js, Express.js, HTML5, CSS3, Tailwind CSS.
Databases & Tools: MongoDB, PostgreSQL, Redis, Docker, Git, GitHub, Postman, Jest.

EXPERIENCE:
Software Engineering Intern | DevSprint Labs (Jan 2025 - Present)
- Engineered scalable RESTful endpoints using Express and Node.js for cloud inventory services.
- Optimized MongoDB queries through aggregation pipelines, cutting response latencies by 38%.
- Integrated React dashboard components for internal analytics.

PROJECTS:
CampusCart (MERN Stack): Built full-stack web application with JWT auth, product catalog, and REST APIs.
DevCollab: Containerized web app built with Docker, React, and Node.js.`,
    formattingQuality: {
      score: 96,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'Clean standard formatting with consistent date conventions and structured skill taxonomy.'
    }
  },
  {
    id: 'res-02',
    candidateName: 'Priya Patel',
    email: 'priya.patel@workmail.com',
    phone: '+91 98450 11223',
    education: 'B.E. in Information Technology, BMS College of Engineering (2022-2026), CGPA: 8.7',
    experienceSummary: 'Proficient MERN stack engineer with strong command of React component lifecycle, custom hooks, and Express backend routing. Built and deployed full-stack collaborative tools with MongoDB and Node.',
    extractedSkills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'REST APIs', 'Git', 'Redux', 'Tailwind CSS', 'Postman'],
    projects: [
      'TaskForge: Project management board built with React, Redux Toolkit, Node.js Express backend, and MongoDB Atlas.',
      'EventPulse: Campus ticketing portal with REST API architecture, user roles, and transactional email triggers.'
    ],
    rawText: `PRIYA PATEL
Contact: priya.patel@workmail.com | +91 98450 11223
B.E. Information Technology (2022 - 2026)

Core Competencies:
React.js, Node.js, Express.js, MongoDB, JavaScript, RESTful APIs, Git, Redux Toolkit, Tailwind.

Internship:
Full Stack Developer Intern @ CloudNine Startups (July 2024 - Dec 2024)
- Built user dashboard using React and responsive CSS.
- Developed backend routes in Node/Express for authentication and user profile management.
- Implemented MongoDB schemas and data validations.`,
    formattingQuality: {
      score: 92,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'Well-structured resume with clear reverse-chronological order and high readability.'
    }
  },
  {
    id: 'res-03',
    candidateName: 'Rohan Verma',
    email: 'rohan.v@techinbox.com',
    phone: '+91 97110 54321',
    education: 'B.Tech in Computer Science, RVCE Bangalore (2022-2026), CGPA: 8.4',
    experienceSummary: 'Full-stack software developer with deep interest in TypeScript, Node.js backend services, and PostgreSQL relational data modeling. Strong understanding of REST design and Docker containerization.',
    extractedSkills: ['TypeScript', 'JavaScript', 'React', 'Node.js', 'Express', 'PostgreSQL', 'Docker', 'REST APIs', 'Git', 'Next.js'],
    projects: [
      'FinTrack API: Microservices-based personal finance tracker with Node.js, Express, TypeScript, and PostgreSQL with Prisma ORM.',
      'PulseUI: Modern React component library documented with Storybook and Tailwind CSS.'
    ],
    rawText: `ROHAN VERMA
Email: rohan.v@techinbox.com | Phone: 97110 54321
Education: B.Tech CS, RV College of Engineering

Skills: TypeScript, JavaScript, React, Node.js, Express, PostgreSQL, Prisma, Docker, Git, REST APIs.

Projects & Experience:
Full-Stack Project Lead (Jan 2024 - Oct 2024)
- Developed secure REST APIs using Node.js, Express, and TypeScript.
- Designed relational schemas in PostgreSQL with foreign keys and indexes.
- Containerized development and test environments using Docker Compose.`,
    formattingQuality: {
      score: 90,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'Standard technical resume layout with clean project summaries.'
    }
  },
  {
    id: 'res-04',
    candidateName: 'Kavya Menon',
    email: 'kavya.menon@student.mit.edu',
    phone: '+91 99001 88776',
    education: 'B.Tech in Computer Science, Manipal Institute of Technology (2022-2026), CGPA: 9.1',
    experienceSummary: 'Passionate full stack developer with active open-source contributions. Built scalable Express microservices and interactive React single page applications with MongoDB backend and Git version control.',
    extractedSkills: ['Node.js', 'Express', 'React', 'JavaScript', 'MongoDB', 'REST APIs', 'Git', 'Tailwind CSS', 'Jest', 'CI/CD'],
    projects: [
      'AlumniPortal: MERN stack platform for college alumni networking with authentication, messaging, and search.',
      'API Sentinel: Monitoring daemon built with Node.js and Express to benchmark REST endpoint uptimes.'
    ],
    rawText: `Kavya Menon
MIT Manipal - Computer Science (2022-2026)
kavya.menon@student.mit.edu

Skills: React, Node.js, Express.js, MongoDB, JavaScript (ES6+), REST APIs, Git, GitHub Actions, Tailwind CSS, Jest.

Experience:
Web Dev Lead @ MIT Open Source Club (2023 - Present)
- Supervised development of university web apps using React and Express.
- Created RESTful backend endpoints with MongoDB schema validation.
- Configured GitHub Actions CI/CD pipeline for automated testing.`,
    formattingQuality: {
      score: 94,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'Clean layout with strong emphasis on relevant skills and open-source leadership.'
    }
  },
  {
    id: 'res-05',
    candidateName: 'Ananya Iyer',
    email: 'ananya.iyer@gmail.com',
    phone: '+91 98860 33445',
    education: 'B.Tech in CSE, PES University Bangalore (2022-2026), CGPA: 8.6',
    experienceSummary: 'Frontend-heavy full stack developer with extensive React, JavaScript, and Tailwind experience. Possesses foundational Node.js and Express API knowledge with Git workflow experience.',
    extractedSkills: ['React', 'JavaScript', 'Tailwind CSS', 'Node.js', 'Express', 'HTML5', 'CSS3', 'Git', 'REST APIs', 'Figma'],
    projects: [
      'SmartDashboard: React analytics dashboard with charting, dark mode toggle, and API integration.',
      'RecipeVault: Web app with Express API backend and React UI for sharing culinary recipes.'
    ],
    rawText: `ANANYA IYER - Front-End & Full Stack Developer
Contact: ananya.iyer@gmail.com

Technical Arsenal:
Front-end: React.js, JavaScript, Tailwind CSS, HTML5, CSS3, Redux
Back-end: Node.js, Express.js (Basic to Intermediate), REST APIs
Tools: Git, GitHub, VS Code, Figma

Projects:
- SmartDashboard (React, Tailwind, REST): Interactive UI connecting to public weather and market APIs.
- RecipeVault: Express.js server providing CRUD endpoints consumed by a React client.`,
    formattingQuality: {
      score: 88,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: true,
      detectedTypos: [],
      notes: 'Visual headers vary slightly; strong frontend focus with intermediate backend coverage.'
    }
  },
  {
    id: 'res-06',
    candidateName: 'Meera Joshi',
    email: 'meera.joshi@outlook.com',
    phone: '+91 97400 99881',
    education: 'B.Tech in Information Science, NIE Mysore (2022-2026), CGPA: 8.3',
    experienceSummary: 'Hands-on developer with practical MERN stack experience. Created REST endpoints using Express, integrated MongoDB Atlas collections, and deployed cloud apps to AWS EC2.',
    extractedSkills: ['React', 'Express', 'MongoDB', 'Node.js', 'JavaScript', 'REST APIs', 'Git', 'AWS EC2', 'Postman'],
    projects: [
      'HostelMate: Booking and room allocation platform for college dormitories using React and Node/Express backend.',
      'QuickNote: Minimalist markdown note-taking tool with MongoDB persistence.'
    ],
    rawText: `Meera Joshi
nie mysore - b.tech information science
meera.joshi@outlook.com | 97400 99881

TECHNICAL SKILLS:
React, Express, MongoDB, Node.js, JavaScript, REST APIs, Git, AWS EC2, Postman.

WORK EXPERIENCE:
Web Intern - SparkTech (June 2024 - August 2024)
- Built REST API endpoints in Express for user auth and data retrieval.
- Connected MongoDB database and created index models.
- Built interactive frontend screens with React.js.`,
    formattingQuality: {
      score: 85,
      hasInconsistentHeaders: true,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'Inconsistent capitalization in headers; clear tech stack matching the JD.'
    }
  },
  {
    id: 'res-07',
    candidateName: 'Vikram Singh',
    email: 'vikram.singh@coderepo.org',
    phone: '+91 98101 22334',
    education: 'B.Tech in Computer Science, Thapar University (2022-2026), CGPA: 8.5',
    experienceSummary: 'Strong backend engineer proficient in Python, Django, PostgreSQL, and REST API development. Built Vue.js frontends and understands full stack architectural principles, but has limited exposure to Node.js/React.',
    extractedSkills: ['Python', 'Django', 'PostgreSQL', 'REST APIs', 'Vue.js', 'JavaScript', 'Git', 'Docker', 'Linux', 'SQL'],
    projects: [
      'AuthService: High-throughput token auth service written in Django REST Framework with PostgreSQL and Docker.',
      'AgriMarket: Full stack farming goods marketplace with Vue.js frontend and Python backend.'
    ],
    rawText: `Vikram Singh | Software Engineer
vikram.singh@coderepo.org

Skills: Python, Django, REST APIs, PostgreSQL, Vue.js, JavaScript, Docker, Git, Linux, SQL.

Experience:
Backend Intern | AgriTech India (May 2024 - July 2024)
- Developed RESTful API services using Django and PostgreSQL.
- Handled schema migrations, database indexing, and query optimization.
- Collaborated using Git feature branches and code reviews.`,
    formattingQuality: {
      score: 92,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'High semantic relevance for backend/REST/database design, but different primary stack (Python/Django instead of Node/React).'
    }
  },
  {
    id: 'res-08',
    candidateName: 'Devansh Mehta',
    email: 'devansh.mehta@mit.manipal.edu',
    phone: '+91 99800 44556',
    education: 'B.Tech in IT, Manipal Institute of Technology (2022-2026), CGPA: 8.8',
    experienceSummary: 'Backend developer focused on enterprise Java, Spring Boot, and MySQL relational databases. Built basic React frontend demos for academic coursework. Strong in object-oriented design and REST endpoints.',
    extractedSkills: ['Java', 'Spring Boot', 'MySQL', 'REST APIs', 'Git', 'JavaScript', 'React', 'Hibernate', 'Docker'],
    projects: [
      'BankingService: Spring Boot REST API for transaction ledger management with MySQL relational schema.',
      'LibraryManager: Small React web app consuming Java backend endpoints.'
    ],
    rawText: `DEVANSH MEHTA
MIT Manipal | devansh.mehta@mit.manipal.edu

Skills: Java, Spring Boot, MySQL, REST APIs, Git, JavaScript, React (Basic), Docker, Maven.

Academic Projects:
- BankingService: Designed RESTful API endpoints with Spring Boot and MySQL.
- LibraryManager: Built basic React interface integrated with backend microservices.`,
    formattingQuality: {
      score: 90,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'Strong backend foundation in Java ecosystem; partial keyword match for React/REST, missing Node/Express/Mongo.'
    }
  },
  {
    id: 'res-09',
    candidateName: 'Sneha Kulkarni',
    email: 'sneha.k@devmail.com',
    phone: '+91 98440 66778',
    education: 'B.Tech in CSE, Dayananda Sagar College of Engineering (2022-2026), CGPA: 8.2',
    experienceSummary: 'Frontend web and cross-platform mobile developer. Extensive experience building user interfaces with React, Tailwind CSS, and Firebase cloud services. Limited traditional Node.js/Express backend experience.',
    extractedSkills: ['React', 'JavaScript', 'Tailwind CSS', 'Firebase', 'Git', 'React Native', 'HTML5', 'CSS3', 'REST APIs'],
    projects: [
      'FitTrack: React and Firebase workout logging web app with real-time Firestore database sync.',
      'CampusBuzz: Mobile social feed built with React Native and cloud storage.'
    ],
    rawText: `Sneha Kulkarni
Phone: 9844066778 | Email: sneha.k@devmail.com

Skills: React, JavaScript, Tailwind CSS, Firebase (Firestore, Auth), Git, React Native, HTML5, CSS3, REST APIs.

Projects:
FitTrack (React, Firebase): Built responsive web application with user auth, real-time database listener, and Tailwind UI.
CampusBuzz: React Native app with cloud backend.`,
    formattingQuality: {
      score: 87,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'Strong React frontend and Firebase skills, but lacks custom Node/Express server and MongoDB.'
    }
  },
  {
    id: 'res-10',
    candidateName: 'Harsh Vardhan',
    email: 'harsh.v@cloudcode.dev',
    phone: '+91 97330 11992',
    education: 'B.Tech in Computer Science, SRM University (2022-2026), CGPA: 8.5',
    experienceSummary: 'Systems and backend software developer with experience in Golang (Go), Gin web framework, PostgreSQL, and Docker. Built React frontend dashboards. Strong understanding of concurrency and RESTful protocols.',
    extractedSkills: ['Go', 'Golang', 'PostgreSQL', 'Docker', 'REST APIs', 'React', 'JavaScript', 'Git', 'Linux'],
    projects: [
      'GoStream: Concurrent video metadata streaming server in Golang with PostgreSQL storage.',
      'MetricsView: React dashboard monitoring server CPU and memory over REST endpoints.'
    ],
    rawText: `HARSH VARDHAN
harsh.v@cloudcode.dev | 97330 11992

Skills: Golang, PostgreSQL, Docker, REST APIs, React, JavaScript, Git, Linux, Gin.

Projects:
- GoStream: High-concurrency backend API with Go and PostgreSQL.
- MetricsView: React monitoring dashboard connecting to REST APIs.`,
    formattingQuality: {
      score: 89,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'High technical aptitude; uses Go instead of Node/Express, but has React and REST knowledge.'
    }
  },
  {
    id: 'res-11',
    candidateName: 'Tanvi Deshmukh',
    email: 'tanvi.deshmukh24@gmail.com',
    phone: '+91 96200 44110',
    education: 'B.E. in Electronics & Communication, MIT Manipal (2022-2026), CGPA: 7.9',
    experienceSummary: 'Self-motivated web development enthusiast who completed MERN stack bootcamps. Built beginner projects with React and Express with MongoDB, but resume suffers from OCR typos and non-standard structure.',
    extractedSkills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'HTML', 'CSS', 'Git'],
    projects: [
      'TodoApp: Basic MERN application with CRUD functionality and MongoDB database.',
      'WeatherCast: Fetching API data in React using OpenWeather API.'
    ],
    rawText: `tanvi deshmukh -- RESUME
Email: tanvi.deshmukh24@gmail.com
Edu: B.E. ECE from MIT Manipal (22-26)

Skill Set:
ReactJS, NodeJS, Expres.js (Express), Mongodb, JavaScrip, HTML, CSS, Gitt.

Projekts:
- TodoApp: created full stack mern app with Expres and Mongodb for notes saving.
- WeatherCast: ReactJS website to fetch weather data with API.`,
    formattingQuality: {
      score: 62,
      hasInconsistentHeaders: true,
      hasVariedDateFormats: true,
      detectedTypos: ['Expres.js', 'Mongodb', 'JavaScrip', 'Gitt', 'Projekts'],
      notes: 'Noticeable formatting inconsistencies, typos ("Expres", "Gitt", "Projekts"), non-standard section headers, but genuinely understands MERN stack.'
    }
  },
  {
    id: 'res-12',
    candidateName: 'Aditya Rao',
    email: 'aditya.rao@webdev.net',
    phone: '+91 98119 55667',
    education: 'BCA, Bangalore University (2022-2025), Aggregate: 74%',
    experienceSummary: 'Traditional LAMP stack web developer with experience in PHP, Laravel, MySQL, and jQuery. Transitioning into modern JavaScript frameworks and looking for internship opportunities.',
    extractedSkills: ['PHP', 'Laravel', 'MySQL', 'JavaScript', 'HTML5', 'CSS3', 'Git', 'REST APIs', 'jQuery'],
    projects: [
      'CollegeCMS: Content management portal built with Laravel PHP and MySQL.',
      'InventoryLite: PHP REST endpoints consumed by a jQuery AJAX frontend.'
    ],
    rawText: `Aditya Rao
BCA Graduate (2022-2025)
aditya.rao@webdev.net

SKILLS: PHP, Laravel, MySQL, JavaScript, HTML5, CSS3, jQuery, REST APIs, Git.

WORK HISTORY:
Freelance Web Developer (2024)
- Built web portals using PHP/Laravel and relational MySQL databases.
- Created REST endpoints and integrated AJAX requests.`,
    formattingQuality: {
      score: 82,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: true,
      detectedTypos: [],
      notes: 'Classic PHP/MySQL background; lacks modern React and Node.js frameworks.'
    }
  },
  {
    id: 'res-13',
    candidateName: 'Karan Malhotra',
    email: 'karan.m@datascience.ai',
    phone: '+91 99450 77889',
    education: 'B.Tech in Data Science & AI, Manipal Institute of Technology (2022-2026), CGPA: 8.9',
    experienceSummary: 'Data science and machine learning practitioner. Skilled in Python, PyTorch, Pandas, and building small model serving endpoints with Flask. Limited frontend and full-stack software engineering background.',
    extractedSkills: ['Python', 'PyTorch', 'Pandas', 'NumPy', 'Machine Learning', 'Flask', 'SQL', 'Git'],
    projects: [
      'ImageClassifier: ResNet-based image classification pipeline in PyTorch.',
      'ChurnPredict: Customer retention forecasting model served via lightweight Flask API.'
    ],
    rawText: `Karan Malhotra | AI & ML Specialist
MIT Manipal (Data Science & AI)
karan.m@datascience.ai

Technical Skills:
Python, PyTorch, TensorFlow, Scikit-Learn, Pandas, NumPy, SQL, Flask (Basic), Git.

Projects:
- ImageClassifier: Computer vision model trained on CIFAR-10.
- ChurnPredict: Machine learning model with Flask API wrapper.`,
    formattingQuality: {
      score: 91,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'High academic caliber in AI/Data Science, but poor skill overlap for a full stack web development role.'
    }
  },
  {
    id: 'res-14',
    candidateName: 'Ishita Sen',
    email: 'ishita.sen@testlab.io',
    phone: '+91 98300 12456',
    education: 'B.Tech in CSE, Heritage Institute of Technology (2022-2026), CGPA: 8.0',
    experienceSummary: 'Quality assurance and software testing engineer. Proficient in automated end-to-end testing with Cypress and Selenium, API testing with Postman, and writing JavaScript test suites.',
    extractedSkills: ['Cypress', 'Selenium', 'JavaScript', 'Postman', 'QA Testing', 'Git', 'Jira', 'API Testing'],
    projects: [
      'AutoTester: Test automation framework written in JavaScript using Cypress.',
      'API Regression Suite: Postman collection with Newman CLI for automated regression testing.'
    ],
    rawText: `ISHITA SEN - QA & Automation Engineer
ishita.sen@testlab.io

Skills: Cypress, Selenium WebDriver, JavaScript, Postman, API Testing, Git, Jira, CI/CD Test Automation.

Experience:
QA Intern @ QualityFirst (July 2024 - Sept 2024)
- Wrote automated test scripts for web applications in Cypress.
- Tested REST API responses using Postman and Newman.`,
    formattingQuality: {
      score: 86,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'QA/Testing specialist with JavaScript and REST API familiarity, but lacks feature development in React/Node.'
    }
  },
  {
    id: 'res-15',
    candidateName: 'Pooja Reddy',
    email: 'pooja.reddy@designcraft.com',
    phone: '+91 97000 88123',
    education: 'B.Des / Interaction Design, NIFT Bangalore (2022-2026), CGPA: 8.6',
    experienceSummary: 'Product and UI/UX designer. Expertise in wireframing, user research, Figma prototypes, and basic semantic HTML/CSS styling. Minimal programming or backend development experience.',
    extractedSkills: ['Figma', 'UI/UX Design', 'User Research', 'HTML5', 'CSS3', 'Prototyping', 'Wireframing'],
    projects: [
      'TravelEase: End-to-end mobile app design system and clickable Figma prototype.',
      'PortfolioSite: Hand-coded HTML/CSS landing page for personal design portfolio.'
    ],
    rawText: `POOJA REDDY - Product Designer
pooja.reddy@designcraft.com

Tools: Figma, Adobe XD, HTML5, CSS3, User Research, Prototyping.

Projects:
TravelEase: Figma UI design system and user testing.
Portfolio: Static HTML/CSS showcase.`,
    formattingQuality: {
      score: 88,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'Design-centric profile; lacks programming in React, Node.js, Express, databases, and APIs.'
    }
  },
  {
    id: 'res-16',
    candidateName: 'Rahul Nair',
    email: 'rahul.nair@embedded.tech',
    phone: '+91 98470 33221',
    education: 'B.Tech in Electrical & Electronics, NIT Calicut (2022-2026), CGPA: 8.4',
    experienceSummary: 'Embedded firmware and hardware systems developer. Skilled in C, C++, ARM microcontrollers, FreeRTOS, and IoT sensor integration. No web or full stack development experience.',
    extractedSkills: ['C', 'C++', 'Embedded Systems', 'FreeRTOS', 'ARM Cortex', 'IoT', 'Git', 'Linux'],
    projects: [
      'SmartDrone: Flight controller firmware programmed in C with accelerometer telemetry.',
      'SensorMesh: FreeRTOS task scheduler reading sensor payloads over SPI/I2C.'
    ],
    rawText: `Rahul Nair | Embedded Systems
rahul.nair@embedded.tech

Skills: C, C++, ARM Cortex, FreeRTOS, Embedded C, Linux, Git, I2C/SPI.

Projects:
SmartDrone: C-based attitude estimation firmware on STM32 microcontroller.
SensorMesh: RTOS wireless sensor gateway.`,
    formattingQuality: {
      score: 89,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'Hardware & embedded systems engineer with near-zero relevance to web/full-stack technologies.'
    }
  },
  {
    id: 'res-17',
    candidateName: 'Siddharth Das',
    email: 'siddharth.das@netops.org',
    phone: '+91 98220 77114',
    education: 'B.Sc in Information Technology, St. Xavier\'s College (2022-2025), Aggregate: 68%',
    experienceSummary: 'IT infrastructure and network administration. Experience in CCNA routing, firewall configuration, Linux server maintenance, and Bash scripting.',
    extractedSkills: ['Networking', 'Linux', 'Bash', 'Cisco Packet Tracer', 'TCP/IP', 'Firewalls', 'System Administration'],
    projects: [
      'CampusLAN: Virtualized network topology configured with VLANs and OSPF routing in Cisco Packet Tracer.',
      'BackupCron: Bash script automating server logs archival and rotation.'
    ],
    rawText: `Siddharth Das
IT & Network Administrator
siddharth.das@netops.org

Skills: Networking, Linux (Ubuntu/CentOS), Bash, TCP/IP, DNS, DHCP, Firewalls, Wireshark.

Projects:
CampusLAN: Designed multi-subnet network architecture.
BackupCron: Automated server backup script in Bash.`,
    formattingQuality: {
      score: 84,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'Network & sysadmin background with no web application or full stack experience.'
    }
  },
  {
    id: 'res-18',
    candidateName: 'Zoya Khan',
    email: 'zoya.khan@growthmedia.com',
    phone: '+91 97660 55432',
    education: 'BBA in Marketing, Christ University Bangalore (2022-2025), CGPA: 8.1',
    experienceSummary: 'Digital marketer and content strategist with experience in SEO, Google Analytics, social media marketing campaigns, and basic WordPress website updates.',
    extractedSkills: ['Digital Marketing', 'SEO', 'Google Analytics', 'Content Writing', 'WordPress', 'Social Media Marketing'],
    projects: [
      'EcoStore Campaign: Managed Google Ads and organic SEO boosting web traffic by 45%.',
      'WordpressBlog: Installed themes and created blog content on managed WordPress CMS.'
    ],
    rawText: `Zoya Khan - Digital Marketing & Growth
zoya.khan@growthmedia.com

Skills: Digital Marketing, SEO, Google Analytics, Content Strategy, WordPress, Social Media.

Experience:
Marketing Intern @ BrandBooster (2024)
- Managed organic search optimizations and content calendars.
- Updated blog posts using WordPress dashboard.`,
    formattingQuality: {
      score: 85,
      hasInconsistentHeaders: false,
      hasVariedDateFormats: false,
      detectedTypos: [],
      notes: 'Completely non-technical marketing profile with no software engineering or programming skills.'
    }
  }
];
