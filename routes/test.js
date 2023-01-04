const express = require("express");
const router = express.Router();
const { toDoList } = require("../models");

router.get("/", async (req, res) => {
  const Lista = await toDoList.findAll({}).then((Lista) => {
    res.render("test", {
      Lista,
    });
  });
});

module.exports = router;
