// Database-level document validation ($jsonSchema) for the 5 collections.
//
// Mongoose validation (models/index.js) only runs when data goes through the API.
// These validators live inside MongoDB itself, so an insert or update made from
// Compass, mongosh or any other driver is also rejected if it breaks the rules.
// They are applied by `npm run seed` and by `npm run db:validators`
// (validationLevel "strict", validationAction "error").
//
// Optional fields allow null because Mongoose stores an empty Number cast as null.

const HHMM = "^([01][0-9]|2[0-3]):[0-5][0-9]$";
const EMAIL = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

const schemas = {
  users: {
    bsonType: "object",
    required: ["name", "email", "passwordHash", "role"],
    properties: {
      name:         { bsonType: "string", minLength: 1 },
      email:        { bsonType: "string", pattern: EMAIL },
      passwordHash: { bsonType: "string", minLength: 1 },
      role:         { enum: ["patient", "doctor", "admin"] },
      phone:        { bsonType: ["string", "null"] },
      createdAt:    { bsonType: "date" },
    },
  },

  departments: {
    bsonType: "object",
    required: ["name", "consultationFee"],
    properties: {
      name:            { bsonType: "string", minLength: 1 },
      description:     { bsonType: ["string", "null"] },
      consultationFee: { bsonType: "number", minimum: 0 },
    },
  },

  doctors: {
    bsonType: "object",
    required: ["userId", "name", "departmentId", "workingDays", "workingHours", "status"],
    properties: {
      userId:         { bsonType: "objectId" },
      name:           { bsonType: "string", minLength: 1 },
      departmentId:   { bsonType: "objectId" },
      specialization: { bsonType: ["string", "null"] },
      workingDays: {
        bsonType: "array", minItems: 1, maxItems: 7,
        items: { bsonType: "number", minimum: 0, maximum: 6 },
      },
      workingHours: {
        bsonType: "object",
        required: ["start", "end"],
        properties: {
          start: { bsonType: "string", pattern: HHMM },
          end:   { bsonType: "string", pattern: HHMM },
        },
      },
      status: { enum: ["Available", "Busy", "On Leave"] },
    },
  },

  patients: {
    bsonType: "object",
    required: ["userId", "name"],
    properties: {
      userId:  { bsonType: "objectId" },
      name:    { bsonType: "string", minLength: 1 },
      age:     { bsonType: ["number", "null"], minimum: 0, maximum: 120 },
      gender:  { enum: ["Male", "Female", "Other", null] },
      contact: { bsonType: ["string", "null"] },
      address: { bsonType: ["string", "null"] },
    },
  },

  appointments: {
    bsonType: "object",
    required: ["patientId", "doctorId", "departmentId", "date", "timeSlot", "status"],
    properties: {
      patientId:    { bsonType: "objectId" },
      doctorId:     { bsonType: "objectId" },
      departmentId: { bsonType: "objectId" },
      date:         { bsonType: "date" },
      timeSlot:     { bsonType: "string", pattern: HHMM },
      status:       { enum: ["Scheduled", "Completed", "Cancelled"] },
      reason:       { bsonType: ["string", "null"], maxLength: 300 },
      createdAt:    { bsonType: "date" },
    },
  },
};

// Creates each collection if it does not exist yet, then attaches its validator.
// `db` is a native driver Db (mongoose.connection.db).
async function applyValidators(db) {
  for (const [name, schema] of Object.entries(schemas)) {
    try {
      await db.createCollection(name);
    } catch (e) {
      if (e.code !== 48) throw e; // 48 = NamespaceExists: already created, fine
    }
    await db.command({
      collMod: name,
      validator: { $jsonSchema: schema },
      validationLevel: "strict",
      validationAction: "error",
    });
  }
}

/* ------------------------------------------------------------------------------
   Offline checker used only by `npm run seed:check` (no database available).
   It evaluates the subset of $jsonSchema keywords used above against the plain
   objects Mongoose would write. This is a pre-check; MongoDB enforces the real
   validator when the data is inserted.
   ------------------------------------------------------------------------------ */
function bsonTypeOf(v) {
  if (v === null || v === undefined) return "null";
  if (v instanceof Date) return "date";
  if (Array.isArray(v)) return "array";
  if (v && v._bsontype === "ObjectId") return "objectId";
  if (typeof v === "number") return Number.isFinite(v) ? "number" : "invalid";
  if (typeof v === "string") return "string";
  if (typeof v === "boolean") return "bool";
  if (typeof v === "object") return "object";
  return "unknown";
}

function checkValue(schema, v, path, errors) {
  if (schema.bsonType) {
    const allowed = [].concat(schema.bsonType);
    if (!allowed.includes(bsonTypeOf(v))) {
      errors.push(`${path}: expected ${allowed.join("|")}, got ${bsonTypeOf(v)}`);
      return;
    }
  }
  if (schema.enum && !schema.enum.some(e => e === v || (e === null && v === undefined)))
    errors.push(`${path}: ${JSON.stringify(v)} not in enum`);
  if (typeof v === "string") {
    if (schema.pattern && !new RegExp(schema.pattern).test(v)) errors.push(`${path}: pattern mismatch`);
    if (schema.minLength !== undefined && v.length < schema.minLength) errors.push(`${path}: too short`);
    if (schema.maxLength !== undefined && v.length > schema.maxLength) errors.push(`${path}: too long`);
  }
  if (typeof v === "number") {
    if (schema.minimum !== undefined && v < schema.minimum) errors.push(`${path}: below minimum`);
    if (schema.maximum !== undefined && v > schema.maximum) errors.push(`${path}: above maximum`);
  }
  if (Array.isArray(v)) {
    if (schema.minItems !== undefined && v.length < schema.minItems) errors.push(`${path}: too few items`);
    if (schema.maxItems !== undefined && v.length > schema.maxItems) errors.push(`${path}: too many items`);
    if (schema.items) v.forEach((x, i) => checkValue(schema.items, x, `${path}[${i}]`, errors));
  }
  if (bsonTypeOf(v) === "object") {
    for (const k of schema.required || [])
      if (v[k] === undefined) errors.push(`${path}.${k}: required`);
    for (const [k, sub] of Object.entries(schema.properties || {}))
      if (v[k] !== undefined) checkValue(sub, v[k], `${path}.${k}`, errors);
  }
}

// Returns a list of error strings (empty = document passes)
function checkDocument(collection, doc) {
  const errors = [];
  checkValue(schemas[collection], doc, collection, errors);
  return errors;
}

module.exports = { schemas, applyValidators, checkDocument };
