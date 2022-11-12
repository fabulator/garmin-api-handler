# Garmin API handler

[![npm version](https://badge.fury.io/js/garmin-api-handler.svg)](https://badge.fury.io/js/garmin-api-handler)
[![renovate-app](https://img.shields.io/badge/renovate-app-blue.svg)](https://renovateapp.com/) 
[![Known Vulnerabilities](https://snyk.io/test/github/fabulator/garmin-api-handler/badge.svg)](https://snyk.io/test/github/fabulator/garmin-api-handler)
[![codecov](https://codecov.io/gh/fabulator/garmin-api-handler/branch/master/graph/badge.svg)](https://codecov.io/gh/fabulator/garmin-api-handler) 
[![travis](https://travis-ci.org/fabulator/garmin-api-handler.svg?branch=master)](https://travis-ci.org/fabulator/garmin-api-handler)


This is an unofficial handler for Garmin Connect API. The documentation is bad :)

## How to download fit files, example:

```javascript
const fs = require('fs');
const path = require('path');
const { GarminApi } = require('../dist');
const { DateTime } = require('luxon');
require('cross-fetch/polyfill');

const extract = require('extract-zip')


const api = new GarminApi();

(async () => {
    await api.login(LOGIN, PASSWORD);

    const activities = await api.getActivities({limit: 1000, startDate: DateTime.fromJSDate(new Date('2020-01-01')).startOf('day'), endDate: DateTime.fromJSDate(new Date('2020-12-31')).endOf('day')});

    await Promise.all(activities.map(async (activity) => {
        const data = await api.getActivityFile(activity.getId());
        const fileName = `files/${activity.getId()}.fit.zip`;
        fs.writeFileSync(fileName, Buffer.from(await data.arrayBuffer()));
        await extract(path.resolve(__dirname, '..', fileName), { dir: path.resolve(__dirname, '..', 'files') })
        fs.rmSync(fileName);
    }));
})()

```
