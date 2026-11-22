import assert from 'node:assert';
import test from 'node:test';
import {
  getAllIndianStates,
  getPlacesForState,
  findNearestPlaceInIndia,
  reverseGeocodeLocation,
} from '../config/indiaLocations';
import { reportService } from '../services/reportService';
import { isCoordinateInIndia } from '../config/geographicBounds';

test('India Locations Engine — Comprehensive Verification', async (t) => {
  await t.test('Test 1: All 28 Indian States and 8 Union Territories are registered', () => {
    const states = getAllIndianStates();
    assert.strictEqual(states.length, 36, 'Must contain all 28 states + 8 UTs');
    assert.ok(states.includes('Maharashtra'));
    assert.ok(states.includes('Karnataka'));
    assert.ok(states.includes('Tamil Nadu'));
    assert.ok(states.includes('Telangana'));
    assert.ok(states.includes('Delhi (NCT)'));
    assert.ok(states.includes('Gujarat'));
    assert.ok(states.includes('Uttar Pradesh'));
  });

  await t.test('Test 2: Selecting any state returns its corresponding places with coordinates', () => {
    const mhPlaces = getPlacesForState('Maharashtra');
    assert.ok(mhPlaces.length > 5, 'Maharashtra should have multiple places');
    assert.ok(mhPlaces.some((p) => p.name.includes('Mumbai')));
    assert.ok(mhPlaces.some((p) => p.name.includes('Pune')));

    const kaPlaces = getPlacesForState('Karnataka');
    assert.ok(kaPlaces.some((p) => p.name.includes('Bengaluru')));
    assert.ok(kaPlaces.some((p) => p.name.includes('Mysuru')));

    const dlPlaces = getPlacesForState('Delhi (NCT)');
    assert.ok(dlPlaces.some((p) => p.name.includes('New Delhi')));
  });

  await t.test('Test 3: Nearest place finder accurately identifies location from GPS coordinates', () => {
    // Mumbai coordinates: ~19.07, 72.87
    const mumbaiMatch = findNearestPlaceInIndia(19.0760, 72.8777);
    assert.strictEqual(mumbaiMatch.state.name, 'Maharashtra');
    assert.ok(mumbaiMatch.place.name.includes('Mumbai'));

    // Bengaluru coordinates: ~12.97, 77.59
    const blrMatch = findNearestPlaceInIndia(12.9716, 77.5946);
    assert.strictEqual(blrMatch.state.name, 'Karnataka');
    assert.ok(blrMatch.place.name.includes('Bengaluru'));

    // Delhi coordinates: ~28.61, 77.20
    const delMatch = findNearestPlaceInIndia(28.6139, 77.2090);
    assert.strictEqual(delMatch.state.name, 'Delhi (NCT)');
  });

  await t.test('Test 4: Reverse geocoding with local spatial fallback never fails or throws', async () => {
    const res = await reverseGeocodeLocation(18.5204, 73.8567); // Pune
    assert.ok(res.state, 'State must be present');
    assert.ok(res.city, 'City must be present');
    assert.ok(res.locality, 'Locality must be present');
  });

  await t.test('Test 5: Geographic boundary validation supports all of India', () => {
    assert.strictEqual(isCoordinateInIndia(19.07, 72.87), true, 'Mumbai is in India');
    assert.strictEqual(isCoordinateInIndia(12.97, 77.59), true, 'Bengaluru is in India');
    assert.strictEqual(isCoordinateInIndia(28.61, 77.20), true, 'Delhi is in India');
    assert.strictEqual(isCoordinateInIndia(51.50, -0.12), false, 'London is outside India');
  });

  await t.test('Test 6: reportService.createReport successfully handles any state in India', async () => {
    const res = await reportService.createReport({
      title: 'Water pipe leak in Indiranagar',
      description: 'Main distribution line leaking fresh water onto pavement since morning.',
      category: 'Water leakage',
      severity: 'high',
      locationText: '100ft Road, Indiranagar, Bengaluru, Karnataka',
      neighborhood: 'Bengaluru - Indiranagar',
      state: 'Karnataka',
      city: 'Bengaluru',
      latitude: 12.9784,
      longitude: 77.6408,
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.report.ticketNumber.startsWith('KA-'), `Ticket number should have state prefix KA-: got ${res.report.ticketNumber}`);
    assert.strictEqual(res.report.state, 'Karnataka');
    assert.strictEqual(res.report.location, '100ft Road, Indiranagar, Bengaluru, Karnataka');
  });
});
