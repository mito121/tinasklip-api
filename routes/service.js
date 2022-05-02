const express = require("express");
const router = express();
const Service = require("../models/service");

/* Get all services */
router.get("/", async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Get one service */
router.get("/:id", getService, (req, res) => {
  res.send(res.service);
});

/* Create service */
router.post("/", async (req, res) => {
  const service = new Service({
    name: req.body.name,
    price: req.body.price,
  });

  try {
    const newService = await service.save();
    res.status(201).json({ success: newService }); // status 201 specifically means something was successfully created
  } catch (err) {
    res.status(400).json({ error: err.message }); // status 400 means bad data was recieved
  }
});

/* Update service */
router.patch("/:id", getService, async (req, res) => {
  /* If new name was sent, update service name */
  if (req.body.name) res.service.name = req.body.name;
  /* If new price was sent, update service price */
  if (req.body.price) res.service.price = req.body.price;

  try {
    const updatedService = await res.service.save();
    res.status(200).json({ service: updatedService });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* Delete service */
router.delete("/:id", getService, async (req, res) => {
  try {
    let removedId = res.service._id.toString();
    await res.service.remove();
    res.status(200).json({ message: "Ydelse slettet.", id: removedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Middleware */
async function getService(req, res, next) {
  let service;

  try {
    service = await Service.findById(req.params.id);
    if (service == null)
      return res.status(404).json({ message: "Service not found." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  res.service = service;
  next();
}

module.exports = router;
