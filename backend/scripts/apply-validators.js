// Applies the $jsonSchema validators (models/validators.js) to the 5 collections
// without touching the data:   npm run db:validators
// (npm run seed already does this; use this script if you do not want to re-seed.)
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
require("../dns-override")();
const mongoose = require("mongoose");
const { applyValidators } = require("../models/validators");

(async () => {
  if (!process.env.MONGO_URI) { console.error("MONGO_URI missing in backend/.env"); process.exit(1); }
  mongoose.set("autoCreate", false);
  mongoose.set("autoIndex", false);
  await mongoose.connect(process.env.MONGO_URI);
  await applyValidators(mongoose.connection.db);
  const infos = await mongoose.connection.db.listCollections().toArray();
  for (const c of infos)
    console.log(`${c.name.padEnd(13)} validator: ${c.options && c.options.validator ? "yes" : "no"}`);
  await mongoose.disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
