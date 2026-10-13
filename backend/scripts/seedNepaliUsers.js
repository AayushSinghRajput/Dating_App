import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";

dotenv.config();

const SEED_USERS = [
  {
    user: {
      username: "aayusha_s",
      email: "aayusha.shrestha@example.com",
      password: "SoulmatePassword123!",
      termsAcceptedAt: new Date(),
      emailVerified: true,
    },
    profile: {
      name: "Aayusha Shrestha",
      gender: "female",
      interestedIn: "male",
      age: 23,
      location: "Jhamsikhel, Lalitpur",
      coordinates: { type: "Point", coordinates: [85.3123, 27.6790] },
      profession: "UI/UX Designer at TechSpire",
      education: "Kathmandu University (KU)",
      aboutMe: "Coffee enthusiast & weekend hiker. Believer in good design, indie acoustic music, and meaningful conversations over momos.",
      relationshipGoals: "Long-term relationship",
      hobbies: ["Hiking", "Photography", "Acoustic Music", "Cafe Hopping"],
      lifestyle: {
        smoking: "no",
        drinking: "socially",
        pets: "have pets",
        wantsChildren: "someday",
      },
      preferences: {
        minAge: 20,
        maxAge: 32,
        dealbreakers: [],
        maxDistanceKm: 100,
      },
      profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
      photos: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
      ],
      prompts: [
        {
          question: "My ideal Sunday looks like...",
          answer: "A morning walk in Patan Durbar Square followed by iced Americano and reading.",
        },
        {
          question: "A quick way to win me over...",
          answer: "Take me to your secret spot for the best jhol momo in town.",
        },
      ],
    },
  },
  {
    user: {
      username: "smarika_a",
      email: "smarika.adhikari@example.com",
      password: "SoulmatePassword123!",
      termsAcceptedAt: new Date(),
      emailVerified: true,
    },
    profile: {
      name: "Smarika Adhikari",
      gender: "female",
      interestedIn: "male",
      age: 24,
      location: "New Baneshwor, Kathmandu",
      coordinates: { type: "Point", coordinates: [85.3375, 27.6915] },
      profession: "Content Creator & Digital Marketer",
      education: "Tribhuvan University",
      aboutMe: "Passionate about storytelling, pottery, and sunset road trips to Nagarkot. Looking for someone with genuine energy and good banter.",
      relationshipGoals: "Dating",
      hobbies: ["Travel", "Podcasts", "Road Trips", "Cooking"],
      lifestyle: {
        smoking: "no",
        drinking: "socially",
        pets: "want pets",
        wantsChildren: "not sure",
      },
      preferences: {
        minAge: 21,
        maxAge: 32,
        dealbreakers: [],
        maxDistanceKm: 100,
      },
      profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
      photos: [
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=80",
      ],
      prompts: [
        {
          question: "The key to my heart is...",
          answer: "Spontaneous night rides and playlist swaps.",
        },
        {
          question: "Together, we could...",
          answer: "Plan that trek to Mardi Himal that we keep procrastinating on.",
        },
      ],
    },
  },
  {
    user: {
      username: "pooja_t",
      email: "pooja.thapa@example.com",
      password: "SoulmatePassword123!",
      termsAcceptedAt: new Date(),
      emailVerified: true,
    },
    profile: {
      name: "Pooja Thapa",
      gender: "female",
      interestedIn: "male",
      age: 22,
      location: "Lazimpat, Kathmandu",
      coordinates: { type: "Point", coordinates: [85.3210, 27.7250] },
      profession: "Software Engineer",
      education: "Pulchowk Campus, IOE",
      aboutMe: "Debugging by day, guitar and rooftop sunsets by evening. Introverted at first, but full of stories once we vibe.",
      relationshipGoals: "Long-term relationship",
      hobbies: ["Guitar", "Gaming", "Trekking", "Reading"],
      lifestyle: {
        smoking: "no",
        drinking: "no",
        pets: "have pets",
        wantsChildren: "someday",
      },
      preferences: {
        minAge: 20,
        maxAge: 30,
        dealbreakers: [],
        maxDistanceKm: 100,
      },
      profileImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
      photos: [
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&auto=format&fit=crop&q=80",
      ],
      prompts: [
        {
          question: "I get irrationally excited about...",
          answer: "Finding cozy book cafes in Thamel on rainy afternoons.",
        },
        {
          question: "Simple pleasures...",
          answer: "Hot masala chai on a chilly winter morning.",
        },
      ],
    },
  },
  {
    user: {
      username: "rohan_kc",
      email: "rohan.kc@example.com",
      password: "SoulmatePassword123!",
      termsAcceptedAt: new Date(),
      emailVerified: true,
    },
    profile: {
      name: "Rohan KC",
      gender: "male",
      interestedIn: "women",
      age: 25,
      location: "Sanepa, Lalitpur",
      coordinates: { type: "Point", coordinates: [85.3050, 27.6830] },
      profession: "Architect & Visual Artist",
      education: "Pulchowk Campus",
      aboutMe: "Obsessed with traditional Newari architecture, cycling, and film photography. Looking for someone genuine to explore art galleries and cafes with.",
      relationshipGoals: "Long-term relationship",
      hobbies: ["Cycling", "Architecture", "Art & Design", "Coffee"],
      lifestyle: {
        smoking: "no",
        drinking: "socially",
        pets: "have pets",
        wantsChildren: "yes",
      },
      preferences: {
        minAge: 20,
        maxAge: 30,
        dealbreakers: [],
        maxDistanceKm: 100,
      },
      profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
      photos: [
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
      ],
      prompts: [
        {
          question: "Best travel story...",
          answer: "Bicycled all the way from Kathmandu to Pokhara with just a tent and my camera.",
        },
        {
          question: "We'll get along if...",
          answer: "You appreciate good aesthetics, old rock music, and deep late-night talks.",
        },
      ],
    },
  },
  {
    user: {
      username: "prashant_s",
      email: "prashant.sharma@example.com",
      password: "SoulmatePassword123!",
      termsAcceptedAt: new Date(),
      emailVerified: true,
    },
    profile: {
      name: "Prashant Sharma",
      gender: "male",
      interestedIn: "women",
      age: 26,
      location: "Baluwatar, Kathmandu",
      coordinates: { type: "Point", coordinates: [85.3300, 27.7280] },
      profession: "Product Manager & Fitness Enthusiast",
      education: "Apex College",
      aboutMe: "Weekend gym rat, avid football fan, and amateur home chef. Looking for someone with drive, humor, and a good sense of adventure.",
      relationshipGoals: "Dating",
      hobbies: ["Gym & Fitness", "Football", "Cooking", "Trekking"],
      lifestyle: {
        smoking: "no",
        drinking: "socially",
        pets: "want pets",
        wantsChildren: "someday",
      },
      preferences: {
        minAge: 20,
        maxAge: 32,
        dealbreakers: [],
        maxDistanceKm: 100,
      },
      profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
      photos: [
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&auto=format&fit=crop&q=80",
      ],
      prompts: [
        {
          question: "I'll cook you...",
          answer: "The ultimate homemade chicken biryani or an authentic Thakali dinner.",
        },
        {
          question: "Two truths and a lie...",
          answer: "Trekked Annapurna Base Camp, can't ride a scooter, roasted coffee beans from scratch.",
        },
      ],
    },
  },
];

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is missing in .env");
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected successfully.");

  for (const entry of SEED_USERS) {
    let existingUser = await User.findOne({ email: entry.user.email });
    let userId;

    if (!existingUser) {
      existingUser = await User.create(entry.user);
      userId = existingUser._id;
      console.log(`[Created User] ${entry.user.username} (${entry.user.email})`);
    } else {
      userId = existingUser._id;
      console.log(`[User Exists] ${entry.user.username} (${entry.user.email})`);
    }

    const existingProfile = await Profile.findOne({ user: userId });
    if (!existingProfile) {
      await Profile.create({
        user: userId,
        ...entry.profile,
      });
      console.log(`[Created Profile] ${entry.profile.name}`);
    } else {
      Object.assign(existingProfile, entry.profile);
      await existingProfile.save();
      console.log(`[Updated Profile] ${entry.profile.name}`);
    }
  }

  console.log("All 5 Nepali users seeded successfully!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
