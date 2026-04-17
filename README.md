# FJuan

> An F1 dashboard that actually shows you what you want to see. No ads, no fluff, just data.

FJuan is a full-stack Formula 1 web application that aggregates race schedules, live telemetry, driver statistics, constructor standings, track information, and news – all in one place. It's built for people who want to know when qualifying starts, how late Verstappen brakes into Turn 1, and whether their favourite driver is statistically overrated.

🔗 **Live Demo**: https://f-juan.vercel.app/

## Features

- **Race Calendar** – Every season from 1950 to present, with live countdown to next race. Weekend dates, qualifying times, round numbers.
- **Live Telemetry** – Real-time car data (speed, RPM, throttle, brake, gear, DRS) from OpenF1 API. Lap times, tyre stints, pit stops.
- **Driver Comparison** – Head-to-head stats: wins, podiums, poles, points, win rate, podium rate, average finish position.
- **Constructor Standings** – Current grid with team colours, points, wins, championship history.
- **Race Results & Qualifying** – Full results tables with driver links, team colours, session times.
- **Track Details** – Circuit layout images, lap records, holder names, years, location, first GP, Wikipedia links.
- **F1 News** – RSS-fed headlines from reputable sources. No clickbait.

## Tech Stack

| Category       | Tools |
|----------------|-------|
| Framework      | Next.js 16 (App Router) |
| Language       | TypeScript |
| Styling        | Tailwind CSS |
| APIs           | [Jolpica API](https://github.com/jolpica/jolpica-f1) (historical race data), [OpenF1 API](https://openf1.org) (live telemetry), RSS feeds (news) |
| Deployment     | Vercel |
| Package Manager| npm / bun |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/fjuan.git
cd fjuan

# Install dependencies
npm install
# or
bun install

# Set up environment variables (if any – RSS feeds may need no keys)
cp .env.example .env.local

# Run development server
npm run dev
# or
bun dev
