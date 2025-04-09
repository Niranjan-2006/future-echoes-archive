Future Echoes: A Digital Capsule
**URL**: https://lovable.dev/projects/59439e90-0d24-4822-a463-25b6707f28c6


Future Echoes is a digital time capsule application designed for personal reflection and emotional tracking. It allows users to capture their thoughts, feelings, and experiences at a specific point in time, with the intention of revisiting them in the future.

Here's a breakdown of its core features and how it works:

Digital Capsule Creation: Users can create virtual time capsules by writing text entries about their day, their current state of mind, significant events, or anything they wish to remember.

Scheduled Reveal Dates: Users set a future "reveal date" for their capsule (currently limited to one month). On this date, the capsule is unlocked and the content becomes accessible again.

Sentiment Analysis Integration: Behind the scenes, the text content of each capsule is analyzed using the Hugging Face API. This process identifies the dominant sentiment of the entry (positive, negative, or neutral) and provides a confidence score and a detailed breakdown of sentiment percentages. This analysis is stored alongside the capsule data.

Sentiment-Driven Questioning: To encourage ongoing reflection during the time the capsule is locked, Future Echoes sends users periodic questions. The frequency of these questions is determined by the initial sentiment of their capsule:

Positive/Neutral: Once a week.
Negative: Twice a week.
These questions prompt users to think about their current feelings and experiences, often relating back to the initial emotional state captured in their capsule.
Sentiment Analysis Report: Upon the reveal date, users can access a report that visualizes the sentiment analysis of their original capsule entry. This allows them to gain insights into their past emotional state.

User Account Management: Users can create accounts, manage their time capsules, and potentially control notification preferences.

Data Storage: All user data, including capsule content, reveal dates, and sentiment analysis results, is securely stored using Supabase.

Built with Modern Web Technologies: The frontend is built using React, providing a dynamic and interactive user experience. The backend logic and API interactions are handled with JavaScript and Supabase's features like Edge Functions.

The overarching goal of Future Echoes is to provide users with a unique way to:

Capture a snapshot of their present self.
Reflect on their emotional state over time.
Gain insights into their emotional journey.
Encourage consistent self-reflection through thoughtful questioning.
It's designed to be a personal and introspective tool, helping users connect with their past selves and understand their emotional evolution.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS



