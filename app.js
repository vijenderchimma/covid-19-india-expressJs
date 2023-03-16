const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//ALL STATES LIST

app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
    SELECT *
    FROM state;
    `;
  const statesArray = await db.all(getAllStatesQuery);
  response.send(
    statesArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//STATE ON STATE_ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${stateId};
    `;
  const stateObject = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(stateObject));
});

//GET DISTRICT WITH DISTRICT_ID

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id = ${districtId};
    `;
  const districtArray = await db.get(getDistrictQuery);
  response.send(convertDbObjectToResponseObject(districtArray));
});

//DELETE DISTRICT FROM TABLE

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//UPDATE DISTRICT IN DISTRICT TABLE

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE district
    SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}

    WHERE district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

const totalCovidCases = (dbObject) => {
  return {
    totalCases: dbObject.totalCases,
    totalCured: dbObject.totalCured,
    totalActive: dbObject.totalActive,
    totalDeaths: dbObject.totalDeaths,
  };
};
//TOTAL CASES,CURED,ACTIVE,DEATHS WITH STATE_ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalCasesQuery = `
    SELECT
    SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    Sum(deaths) AS totalDeaths
    From district
    WHERE state_id = ${stateId};
    `;
  const dbResponse = await db.get(getTotalCasesQuery);
  response.send(totalCovidCases(dbResponse));
});

//GET STATE DETAILS WITH DISTRICT_ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
    SELECT state_name
    FROM state NATURAL JOIN district
    WHERE district_id = ${districtId};
    `;
  const stateArray = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(stateArray));
});

//POST DISTRICT IN DISTRICT TABLE

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postDistrictQuery = `
    INSERT INTO
    district (district_name,state_id,cases,cured,active,deaths)
    VALUES
    (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );
    `;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

module.exports = app;
