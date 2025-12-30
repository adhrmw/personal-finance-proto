# Catetin

"Genzi meraih mimpi - sebuah prototype kecil buat bikin kebiasaan besar"

A minimal personal finance prototype focused on friction-less expense tracking. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Code-First Authentication**: No email/password. Just a unique code.
- **Micro-copy**: Dynamic greeting and status messages based on time of day and balance.
- **3-Day View**: Focus on immediate habits (Today, Yesterday, 2 Days Ago).
- **Indonesian Localization**: Friendly, casual tone.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React

## Getting Started

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    pnpm install
    ```
3.  **Set up Environment Variables**:
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
4.  **Run the development server**:
    ```bash
    pnpm dev
    ```

## Database Schema

Table `users`:

- `id`: UUID (Primary Key)
- `display_name`: Text
- `user_code`: Text (Unique)
- `created_at`: Set default to `now()`

Table `transactions`:

- `id`: BigInt (Primary Key)
- `user_id`: UUID (Foreign Key to users.id)
- `amount`: Numeric
- `type`: Text ('income' or 'expense')
- `category`: Text
- `note`: Text
- `occurred_at`: Timestamp
- `created_at`: Timestamp

## Deployment

This project is optimized for deployment on [Vercel](https://vercel.com).
Ensure you add the Environment Variables in your Vercel Project Settings.
