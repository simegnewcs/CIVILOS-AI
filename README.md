# CivilOS AI 🏗️🤖

CivilOS AI is a next-generation, hybrid AI-human project management and workflow platform tailored specifically for the construction and civil engineering industry. 

It streamlines the entire lifecycle of a construction project by pairing AI-generated drafts with professional human review, bridging the gap between automation and certified engineering standards.

## ✨ Key Features

* **Hybrid Workflows**: Multi-stage project pipelines where AI generates initial drafts (Architecture, Structural, Cost Estimation) which are then reviewed, modified, and approved by human professionals.
* **Multi-Role Collaboration**: Tailored dashboards and permissions for Clients, Architects, Structural Engineers, Quantity Surveyors (QS), and Project Managers.
* **Granular Cost Tracking**: Detailed cost estimation breakdowns (Foundation, Structure, Finishes, MEP, Labour).
* **AI Output Auditing**: Historical logging of all AI generations, including the exact prompts and models used, ensuring full traceability.
* **Digital Signatures & Approvals**: Robust stage-gating requiring professional sign-offs before a project can proceed.

## 🚀 Tech Stack

* **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
* **UI/Styling**: React 19, [Tailwind CSS v4](https://tailwindcss.com/)
* **Database**: MySQL managed via [Prisma ORM](https://www.prisma.io/)
* **Language**: TypeScript
* **Authentication**: Custom JWT with bcrypt

## 🛠️ Getting Started

### Prerequisites

Ensure you have Node.js (v20+) installed and a MySQL instance running.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/simegnewcs/CIVILOS-AI.git
   cd CIVILOS-AI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment:
   * Create a `.env` file at the root of the project.
   * Add your database connection string: `DATABASE_URL="mysql://user:password@localhost:3306/civilos"`

4. Set up the database:
   ```bash
   npm run db:generate
   npm run db:push
   # Optional: Seed the database with initial data
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema Overview

The core domain model revolves around:
* **Users** and their roles (Client, Architect, Engineer, QS, PM, Admin).
* **Projects** and their workflow progression.
* **Workflow Stages** tracking the back-and-forth between AI generation and Human approval.
* **Cost Estimates** and raw **AI Outputs** logs.

View `prisma/schema.prisma` for the complete schema.
