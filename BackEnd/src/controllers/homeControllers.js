const dataModel = require("../models/dataModel");

//for chart
const getData = (req, res) => {
  dataModel.getAllData((err, results) => {
    if (err) {
      console.error("Database query error: ", err);
      res.status(500).json({ error: "Database query error" });
      return;
    }
    res.status(200).json(results);
  });
};

const getWeb = (req, res) => {
  res.render("app.ejs");
};

module.exports = {
  getData,
  getWeb,
};
