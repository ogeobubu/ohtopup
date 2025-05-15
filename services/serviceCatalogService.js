const Service = require("../model/Service");

const createService = async (name, isAvailable) => {
  const newService = new Service({ name, isAvailable });
  await newService.save();
  return newService;
};

const updateService = async (serviceId, updateData) => {
  const updatedService = await Service.findByIdAndUpdate(
    serviceId,
    updateData,
    { new: true, runValidators: true }
  ).exec();

  if (!updatedService) {
    throw { status: 404, message: "Service not found" };
  }
  return updatedService;
};

const deleteService = async (serviceId) => {
  const deletedService = await Service.findByIdAndDelete(serviceId).exec();

  if (!deletedService) {
    throw { status: 404, message: "Service not found" };
  }
  return deletedService;
};

const getServices = async () => {
  const services = await Service.find().exec();
  return services;
};

module.exports = {
  createService,
  updateService,
  deleteService,
  getServices,
};
