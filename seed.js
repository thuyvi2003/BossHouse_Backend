// seed.js
require("dotenv").config();
const mongoose = require("mongoose");

// Import models
const User = require("./models/user.model");
const Pet = require("./models/pet.model");
const Service = require("./models/service.model");
const Veterinarian = require("./models/veterinarian.model");
const VetSchedule = require("./models/vetSchedule.model");
const Booking = require("./models/booking.model");

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("🌟 MongoDB connected for seeding"))
  .catch(err => console.error("MongoDB connection error:", err));

const seed = async () => {
  try {
    // Clear old data
    await Promise.all([
      User.deleteMany({}),
      Pet.deleteMany({}),
      Service.deleteMany({}),
      Veterinarian.deleteMany({}),
      VetSchedule.deleteMany({}),
      Booking.deleteMany({})
    ]);
    console.log("🧹 Cleared old data");

    // Create users
    const users = await User.insertMany([
      { name: "Alice", email: "alice@test.com", password: "123456" },
      { name: "Bob", email: "bob@test.com", password: "123456" }
    ]);

    // Create services (default for frontend)
    const services = await Service.insertMany([
      { name: "Grooming", description: "Pet grooming service", base_price: 40, duration_minutes: 45 },
      { name: "Boarding", description: "Pet boarding service", base_price: 100, duration_minutes: 1440 },
      { name: "Health Check", description: "Routine health check", base_price: 50, duration_minutes: 30 },
      { name: "Adoption Consultation", description: "Consultation for adopting a pet", base_price: 20, duration_minutes: 60 }
    ]);

    // Create pets (Dog & Cat)
    const pets = await Pet.insertMany([
      { user_id: users[0]._id, name: "Fluffy", species: "Cat", breed: "Persian", gender: "female", age: 3, weight: 4.5 },
      { user_id: users[1]._id, name: "Buddy", species: "Dog", breed: "Beagle", gender: "male", age: 5, weight: 12 }
    ]);

    // Create veterinarians
    const vets = await Veterinarian.insertMany([
      { user_id: users[0]._id, specialty: "Surgery", years_experience: 10, bio: "Expert in pet surgeries" },
      { user_id: users[1]._id, specialty: "Dermatology", years_experience: 7, bio: "Skin specialist" }
    ]);

    // Create vet schedules
    const now = new Date();
    await VetSchedule.insertMany([
      { veterinarian_id: vets[0]._id, start_time: now, end_time: new Date(now.getTime() + 60 * 60 * 1000) },
      { veterinarian_id: vets[1]._id, start_time: now, end_time: new Date(now.getTime() + 2 * 60 * 60 * 1000) }
    ]);

    // Create bookings
    await Booking.insertMany([
      {
        user_id: users[0]._id,
        pet_id: pets[0]._id,
        service_id: services.find(s => s.name === "Health Check")._id,
        veterinarian_id: vets[0]._id,
        booking_date: new Date(),
        note: "First checkup"
      },
      {
        user_id: users[1]._id,
        pet_id: pets[1]._id,
        service_id: services.find(s => s.name === "Grooming")._id,
        veterinarian_id: vets[1]._id,
        booking_date: new Date(),
        note: "Grooming appointment"
      }
    ]);

    console.log("✅ Seeding completed!");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seed();
