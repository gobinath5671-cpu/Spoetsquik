/* Standalone seed script — run with `bun scripts/seed.ts` */
import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function safeJsonStringifyArray(arr: string[]): string {
  return JSON.stringify(arr || []);
}

async function main() {
  console.log("Seeding SportsFest database...");

  const adminEmail = "admin@sportsfest.in";
  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await db.user.create({
      data: {
        fullName: "SportsFest Admin",
        email: adminEmail,
        passwordHash: hashPassword("Admin@123"),
        role: "admin",
        collegeName: "SportsFest HQ",
      },
    });
    console.log("  Admin created (admin@sportsfest.in / Admin@123)");
  } else {
    console.log("  Admin already exists");
  }

  const eventCount = await db.event.count();
  if (eventCount > 0) {
    console.log(`  ${eventCount} events already exist, skipping sample events`);
  } else {
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    const sampleEvents = [
      {
        collegeName: "Anna University",
        eventName: "Inter-Engineering Athletic Meet 2025",
        eventDate: new Date(now.getTime() + 14 * day),
        reportingTime: "7:30 AM",
        venue: "Anna University Main Ground",
        chiefGuest: "Dr. K. Sathyanarayanan, Director of Sports",
        categories: ["Men", "Women"],
        sportsAndGames: ["Track & Field", "Basketball", "Volleyball"],
        tournamentFormat: "Athletics",
        eligibility: "Open to all engineering colleges. Players must carry valid college ID.",
        prizesCashPrizes: "Rs.1,00,000 overall | Rs.25,000 per event",
        prizesMedals: true,
        prizesChampionship: true,
        prizesDetails: "Individual medals + Overall Championship trophy for top college",
        entryFeePerTeam: 500,
        entryFeePerPlayer: 100,
        entryFeeIsFree: false,
        generalRules: "## Rules\n- Each college can field one team per event.\n- Players must report 30 min before event time.\n- College ID card mandatory.\n- Decisions of the referee are final.",
        dresscode: "College sports kit with proper footwear",
        registrationDeadline: new Date(now.getTime() + 7 * day),
        contactDirectorName: "Mr. Ramesh Kumar",
        contactDirectorPhone: "+91 98765 43210",
        contactCaptainName: "Arjun S",
        contactCaptainPhone: "+91 91234 56780",
        contactEmail: "sports@annauniv.edu",
        status: "upcoming",
        targetAudience: "College",
      },
      {
        collegeName: "Loyola College",
        eventName: "Loyola Premier League - Cricket Tournament",
        eventDate: new Date(now.getTime() + 21 * day),
        reportingTime: "8:00 AM",
        venue: "Loyola College Cricket Ground",
        chiefGuest: "Mr. Krishnamachari Srikkanth",
        categories: ["Men"],
        sportsAndGames: ["Cricket"],
        tournamentFormat: "Knockout",
        eligibility: "Undergraduate men's teams from invited colleges. Max 15 players per squad.",
        prizesCashPrizes: "Winner: Rs.50,000 | Runner-up: Rs.25,000",
        prizesMedals: true,
        prizesChampionship: true,
        prizesDetails: "Trophies for Winner, Runner-up, Best Batsman, Best Bowler, Best Fielder",
        entryFeePerTeam: 2000,
        entryFeePerPlayer: 0,
        entryFeeIsFree: false,
        generalRules: "## Tournament Rules\n- 20 overs per innings.\n- Tennis ball (cosco) format.\n- 11-a-side.\n- Squad of 15 max.\n- Knockout format.",
        dresscode: "Coloured cricket jersey, white trousers, spikes",
        registrationDeadline: new Date(now.getTime() + 12 * day),
        contactDirectorName: "Mr. Peter Rodrigues",
        contactDirectorPhone: "+91 98400 11223",
        contactCaptainName: "Vikram Menon",
        contactCaptainPhone: "+91 90030 44556",
        contactEmail: "sports@loyola.edu.in",
        status: "upcoming",
        targetAudience: "College",
      },
      {
        collegeName: "VIT University",
        eventName: "VIT International Badminton Open",
        eventDate: new Date(now.getTime() + 10 * day),
        reportingTime: "9:00 AM",
        venue: "VIT Indoor Stadium, Court 1-6",
        chiefGuest: "Ms. P. V. Sindhu (Olympic Medalist)",
        categories: ["Men", "Women", "Both"],
        sportsAndGames: ["Badminton"],
        tournamentFormat: "Knockout",
        eligibility: "All college students. Singles, Doubles and Mixed Doubles categories.",
        prizesCashPrizes: "Singles: Rs.20,000 | Doubles: Rs.15,000 per pair",
        prizesMedals: true,
        prizesChampionship: false,
        prizesDetails: "Cash prizes for winners and runners-up in each category",
        entryFeePerTeam: 0,
        entryFeePerPlayer: 300,
        entryFeeIsFree: false,
        generalRules: "## Badminton Rules\n- Best of 3 games to 21.\n- Yonex Mavis 350 shuttle.\n- Players must bring own rackets.\n- Singles, Doubles, Mixed Doubles available.",
        dresscode: "Sports attire, non-marking shoes mandatory",
        registrationDeadline: new Date(now.getTime() + 5 * day),
        contactDirectorName: "Dr. Anitha Rao",
        contactDirectorPhone: "+91 94440 55667",
        contactCaptainName: "Sneha Patil",
        contactCaptainPhone: "+91 88070 99881",
        contactEmail: "sports@vit.ac.in",
        status: "upcoming",
        targetAudience: "College",
      },
      {
        collegeName: "PSG College of Technology",
        eventName: "PSG Football Championship 2025",
        eventDate: new Date(now.getTime() + 3 * day),
        reportingTime: "8:30 AM",
        venue: "PSG Tech Football Ground",
        chiefGuest: "Mr. Bhaichung Bhutia",
        categories: ["Men"],
        sportsAndGames: ["Football"],
        tournamentFormat: "League",
        eligibility: "College men's teams. 11-a-side + 5 substitutes. Squad of 16 max.",
        prizesCashPrizes: "Winner: Rs.40,000 | Runner-up: Rs.20,000 | Best Player: Rs.5,000",
        prizesMedals: true,
        prizesChampionship: true,
        prizesDetails: "Trophies and medals for all podium finishers",
        entryFeePerTeam: 1500,
        entryFeePerPlayer: 0,
        entryFeeIsFree: false,
        generalRules: "## Football Rules\n- 70 minutes (35-35) with 10 min break.\n- League + Knockout format.\n- 11-a-side.\n- Referee decisions final.",
        dresscode: "Team jersey, shorts, football boots with studs",
        registrationDeadline: new Date(now.getTime() + 1 * day),
        contactDirectorName: "Mr. Senthil Kumar",
        contactDirectorPhone: "+91 97890 11223",
        contactCaptainName: "Karthik R",
        contactCaptainPhone: "+91 90000 11223",
        contactEmail: "sports@psgtech.edu",
        status: "upcoming",
        targetAudience: "College",
      },
      {
        collegeName: "Madras Christian College",
        eventName: "MCC Inter-Collegiate Aquatic Meet",
        eventDate: new Date(now.getTime() + 30 * day),
        reportingTime: "7:00 AM",
        venue: "MCC Olympic Swimming Pool",
        chiefGuest: "Mr. Nisha Millet (Arjuna Awardee)",
        categories: ["Men", "Women"],
        sportsAndGames: ["Swimming"],
        tournamentFormat: "Athletics",
        eligibility: "All college swimmers. Medically fit certificate recommended.",
        prizesCashPrizes: "Rs.5,000 per gold | Rs.3,000 per silver | Rs.1,500 per bronze",
        prizesMedals: true,
        prizesChampionship: true,
        prizesDetails: "Individual medals + Overall Championship for best college",
        entryFeePerTeam: 0,
        entryFeePerPlayer: 250,
        entryFeeIsFree: false,
        generalRules: "## Aquatic Meet Rules\n- Events: 50m, 100m, 200m Freestyle, 4x100m Relay.\n- Swim cap and goggles mandatory.\n- Lane draw by lots.\n- False start: disqualification.",
        dresscode: "Competitive swimwear, swim cap, goggles",
        registrationDeadline: new Date(now.getTime() + 20 * day),
        contactDirectorName: "Mr. David Thomas",
        contactDirectorPhone: "+91 98400 77889",
        contactCaptainName: "Priya Menon",
        contactCaptainPhone: "+91 90900 88776",
        contactEmail: "aquatics@mcc.edu.in",
        status: "upcoming",
        targetAudience: "College",
      },
      {
        collegeName: "SBOA School & Junior College",
        eventName: "SBOA Inter-School Sports Day",
        eventDate: new Date(now.getTime() + 45 * day),
        reportingTime: "8:00 AM",
        venue: "SBOA School Ground",
        chiefGuest: "Dr. Meenakshi Rajan, DEO Chennai",
        categories: ["Men", "Women", "Both"],
        sportsAndGames: ["Track & Field", "Basketball", "Volleyball", "Kabaddi"],
        tournamentFormat: "Mixed",
        eligibility: "School students classes 8-12. Age categories: U-14, U-17, U-19.",
        prizesCashPrizes: "Trophies and certificates for all winners",
        prizesMedals: true,
        prizesChampionship: true,
        prizesDetails: "Individual medals + House Championship + Best Athlete award",
        entryFeePerTeam: 0,
        entryFeePerPlayer: 0,
        entryFeeIsFree: true,
        generalRules: "## School Sports Day Rules\n- Age group events.\n- House system competition.\n- Three attempts for field events.\n- Medically fit declaration mandatory.",
        dresscode: "School sports uniform",
        registrationDeadline: new Date(now.getTime() + 35 * day),
        contactDirectorName: "Mr. Franklin Das",
        contactDirectorPhone: "+91 98400 22110",
        contactCaptainName: "Ananya Krishnan",
        contactCaptainPhone: "+91 90090 33221",
        contactEmail: "sports@sboaschool.edu.in",
        status: "upcoming",
        targetAudience: "School",
      },
    ];

    for (const ev of sampleEvents) {
      await db.event.create({
        data: {
          ...ev,
          categories: safeJsonStringifyArray(ev.categories),
          sportsAndGames: safeJsonStringifyArray(ev.sportsAndGames),
        },
      });
    }
    console.log(`  Created ${sampleEvents.length} sample events`);
  }

  console.log("Seed complete!");
  console.log("");
  console.log("Admin login: admin@sportsfest.in / Admin@123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
