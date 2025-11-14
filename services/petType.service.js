const PetType = require("../models/petType.model");

exports.createPetType = async (data) => {
  return await PetType.create(data);
};

exports.getAllPetTypes = async (filter = {}) => {
  return await PetType.find(filter);
};

exports.getPetTypeById = async (id) => {
  return await PetType.findById(id);
};

exports.updatePetType = async (id, data) => {
  return await PetType.findByIdAndUpdate(id, data, { new: true });
};

exports.deletePetType = async (id) => {
  return await PetType.findByIdAndDelete(id);
};
