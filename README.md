# 📚 AksharSetu 

> **Bridging People Through Knowledge**  
> A modern, production-grade platform for book resale and donations.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

## ✨ Overview

AksharSetu is a modern web application built to connect readers, enabling seamless book resale and donations. With a focus on trust, safety, and community, it offers a gamified experience, transparent donation tracking, and a highly interactive user interface powered by 3D elements and smooth animations.

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI/Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations & 3D**: [Framer Motion](https://www.framer.com/motion/), [GSAP](https://gsap.com/), [Three.js](https://threejs.org/) & [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Authentication**: [NextAuth.js (v5)](https://authjs.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+)
- PostgreSQL Database
- npm, yarn, or pnpm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/intrance7/AksharSetu.git
   cd AksharSetu/web
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure Environment Variables
   Create a `.env` file in the `web` directory and add your database and authentication keys:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/aksharsetu"
   AUTH_SECRET="your-secret-key"
   ```

4. Run Database Migrations
   ```bash
   npx prisma db push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## 📖 Internal Documentation

This repository contains foundational planning and architectural blueprints in the root directory:

1. **[Features and Ideas](./01-features-and-ideas.md)**: Core value propositions and gamification.
2. **[Technology Stack](./02-tech-stack.md)**: Chosen tools and frameworks.
3. **[System Architecture](./03-architecture.md)**: High-level system design.
4. **[Future Scalability](./04-scalability.md)**: Scaling long-term.
5. **[Product and MVP](./05-product-and-mvp.md)**: Core product and MVP scope.
6. **[Data Model and Lifecycle](./06-data-model-and-lifecycle.md)**: Books vs. Listings and state management.
7. **[Trust, Safety, and Donations](./07-trust-safety-and-donations.md)**: Moderation and donation tracking.
8. **[Development Roadmap](./08-development-roadmap.md)**: Modular monolith approach and vertical slicing.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
