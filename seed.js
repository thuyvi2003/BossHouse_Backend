// safe-seed.js
require("dotenv").config();
const mongoose = require("mongoose");

// Import models
const User = require("./models/user.model");
const Pet = require("./models/pet.model");
const Service = require("./models/service.model");
const Veterinarian = require("./models/veterinarian.model");
const VetSchedule = require("./models/vetSchedule.model");
const Booking = require("./models/booking.model");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("🌟 MongoDB connected for safe seeding"))
  .catch((err) => console.error("MongoDB connection error:", err));

const seed = async () => {
  try {
    // -----------------------------
    // Users
    // -----------------------------
    const alice = await User.findOneAndUpdate(
      { email: "alice@test.com" },
      { name: "Alice", password: "123456" },
      { upsert: true, new: true }
    );

    const bob = await User.findOneAndUpdate(
      { email: "bob@test.com" },
      { name: "Bob", password: "123456" },
      { upsert: true, new: true }
    );

    console.log("✅ Users seeded");

    // -----------------------------
    // Services
    // -----------------------------
    const serviceData = [
      { name: "Grooming", description: "Pet grooming service", base_price: 40, duration_minutes: 45 },
      { name: "Boarding", description: "Pet boarding service", base_price: 100, duration_minutes: 1440 },
      { name: "Health Check", description: "Routine health check", base_price: 50, duration_minutes: 30 },
      { name: "Adoption Consultation", description: "Consultation for adopting a pet", base_price: 20, duration_minutes: 60 },
    ];

    const services = [];
    for (const s of serviceData) {
      const service = await Service.findOneAndUpdate(
        { name: s.name },
        s,
        { upsert: true, new: true }
      );
      services.push(service);
    }
    console.log("✅ Services seeded");

    // -----------------------------
    // Pets
    // -----------------------------
    const petData = [
      { user_id: alice._id, name: "Fluffy", species: "Cat", breed: "Persian", gender: "female", age: 3, weight: 4.5 },
      { user_id: bob._id, name: "Buddy", species: "Dog", breed: "Beagle", gender: "male", age: 5, weight: 12 },
    ];

    const pets = [];
    for (const p of petData) {
      const pet = await Pet.findOneAndUpdate(
        { name: p.name, user_id: p.user_id },
        p,
        { upsert: true, new: true }
      );
      pets.push(pet);
    }
    console.log("✅ Pets seeded");

    // -----------------------------
    // Veterinarians
    // -----------------------------
    const vetData = [
      { user_id: alice._id, specialty: "Surgery", years_experience: 10, bio: "Expert in pet surgeries" },
      { user_id: bob._id, specialty: "Dermatology", years_experience: 7, bio: "Skin specialist" },
    ];

    const vets = [];
    for (const v of vetData) {
      const vet = await Veterinarian.findOneAndUpdate(
        { user_id: v.user_id },
        v,
        { upsert: true, new: true }
      );
      vets.push(vet);
    }
    console.log("✅ Veterinarians seeded");

    // -----------------------------
    // Vet Schedules (optional, can overwrite)
    // -----------------------------
    const now = new Date();
    for (const [index, v] of vets.entries()) {
      await VetSchedule.findOneAndUpdate(
        { veterinarian_id: v._id, start_time: { $gte: now } },
        { start_time: now, end_time: new Date(now.getTime() + (index + 1) * 60 * 60 * 1000) },
        { upsert: true, new: true }
      );
    }
    console.log("✅ Vet schedules seeded");

    // -----------------------------
    // Bookings
    // -----------------------------
    const bookingData = [
      {
        user_id: alice._id,
        pet_id: pets[0]._id,
        services: [{ service_id: services.find((s) => s.name === "Health Check")._id, quantity: 1 }],
        veterinarian_id: vets[0]._id,
        booking_date: new Date(),
        note: "First checkup",
      },
      {
        user_id: bob._id,
        pet_id: pets[1]._id,
        services: [
          { service_id: services.find((s) => s.name === "Grooming")._id, quantity: 1 },
          { service_id: services.find((s) => s.name === "Boarding")._id, quantity: 1 },
        ],
        veterinarian_id: vets[1]._id,
        booking_date: new Date(),
        note: "Grooming and boarding appointment",
      },
    ];

    for (const b of bookingData) {
      await Booking.findOneAndUpdate(
        { user_id: b.user_id, pet_id: b.pet_id, booking_date: b.booking_date },
        b,
        { upsert: true, new: true }
      );
    }
    console.log("✅ Bookings seeded");

    console.log("🎉 Safe seeding completed!");
    process.exit();
  } catch (err) {
    console.error("❌ Safe seeding error:", err);
    process.exit(1);
  }
};

seed();
