// safe-seed.js
require("dotenv").config();
const mongoose = require("mongoose");

// Import models
const User = require("./models/user.model");
const PetType = require("./models/petType.model");
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
    // --- Users ---
    const userData = [
      { email: "alice@test.com", name: "Alice", password: "123456" },
      { email: "bob@test.com", name: "Bob", password: "123456" },
      { email: "carol@test.com", name: "Carol", password: "123456" },
      { email: "dave@test.com", name: "Dave", password: "123456" },
      { email: "eve@test.com", name: "Eve", password: "123456" },
    ];

    const users = [];
    for (const u of userData) {
      const user = await User.findOneAndUpdate(
        { email: u.email },
        u,
        { upsert: true, new: true }
      );
      users.push(user);
    }
    console.log("✅ Users seeded");

    // --- Pet Types ---
    const petTypeData = [
      { name: "Cat" },
      { name: "Dog" },
      { name: "Bird" },
    ];

    const petTypes = [];
    for (const pt of petTypeData) {
      const petType = await PetType.findOneAndUpdate(
        { name: pt.name },
        pt,
        { upsert: true, new: true }
      );
      petTypes.push(petType);
    }
    console.log("✅ Pet types seeded");

    // --- Pets ---
    const petData = [
      { user_id: users[0]._id, name: "Fluffy", species: "Cat", breed: "Persian", gender: "female", age: 3, weight: 4.5 },
      { user_id: users[1]._id, name: "Buddy", species: "Dog", breed: "Beagle", gender: "male", age: 5, weight: 12 },
      { user_id: users[2]._id, name: "Chirpy", species: "Bird", breed: "Parrot", gender: "female", age: 2, weight: 0.5 },
      { user_id: users[3]._id, name: "Spike", species: "Dog", breed: "Bulldog", gender: "male", age: 4, weight: 20 },
      { user_id: users[4]._id, name: "Shadow", species: "Cat", breed: "Siamese", gender: "female", age: 1, weight: 3 },
    ];

    const pets = [];
    for (const p of petData) {
      const speciesObj = petTypes.find((pt) => pt.name === p.species);
      const pet = await Pet.findOneAndUpdate(
        { user_id: p.user_id, name: p.name },
        { ...p, species: speciesObj._id },
        { upsert: true, new: true }
      );
      pets.push(pet);
    }
    console.log("✅ Pets seeded");

    // --- Services ---
    const serviceData = [
      {
        name: "Grooming",
        description: "Full spa grooming for pets.",
        base_price: 40,
        duration_minutes: 45,
      },
      {
        name: "Boarding",
        description: "Safe boarding for pets while you're away.",
        base_price: 100,
        duration_minutes: 1440,
      },
      {
        name: "Health Check",
        description: "Routine health check for pets.",
        base_price: 50,
        duration_minutes: 30,
      },
      {
        name: "Vaccination",
        description: "Administer vaccines for pets.",
        base_price: 60,
        duration_minutes: 20,
      },
      {
        name: "Adoption Consultation",
        description: "Consultation for pet adoption.",
        base_price: 20,
        duration_minutes: 60,
      },
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

    // --- Veterinarians ---
    const vetData = [
      { user_id: users[0]._id, specialty: "Surgery", years_experience: 10, bio: "Expert in pet surgeries" },
      { user_id: users[1]._id, specialty: "Dermatology", years_experience: 7, bio: "Skin specialist" },
      { user_id: users[2]._id, specialty: "Dentistry", years_experience: 5, bio: "Teeth care for pets" },
      { user_id: users[3]._id, specialty: "Cardiology", years_experience: 8, bio: "Heart specialist" },
      { user_id: users[4]._id, specialty: "General Care", years_experience: 4, bio: "Routine pet health care" },
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

    // --- Bookings ---
    const bookingData = [
      { user_id: users[0]._id, pet_id: pets[0]._id, services: [{ service_id: services[2]._id, quantity: 1 }], veterinarian_id: vets[0]._id, booking_date: new Date(), note: "First checkup" },
      { user_id: users[1]._id, pet_id: pets[1]._id, services: [{ service_id: services[0]._id, quantity: 1 }], veterinarian_id: vets[1]._id, booking_date: new Date(), note: "Grooming appointment" },
      { user_id: users[2]._id, pet_id: pets[2]._id, services: [{ service_id: services[3]._id, quantity: 1 }], veterinarian_id: vets[2]._id, booking_date: new Date(), note: "Vaccination day" },
      { user_id: users[3]._id, pet_id: pets[3]._id, services: [{ service_id: services[1]._id, quantity: 1 }], veterinarian_id: vets[3]._id, booking_date: new Date(), note: "Boarding for holiday" },
      { user_id: users[4]._id, pet_id: pets[4]._id, services: [{ service_id: services[4]._id, quantity: 1 }], veterinarian_id: vets[4]._id, booking_date: new Date(), note: "Adoption consultation" },
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
