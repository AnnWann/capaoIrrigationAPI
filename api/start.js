import { getEweLinkCredentials } from "../src/authEwelink";

export default async function handler(req, res) {
  
  const timestamp = new Date().toISOString();
  if (req.method !== 'GET') {
  return res.status(405).json({ error: 'Method not allowed', timestamp });
  }
  const deviceId = req.query.deviceId;
  if (!deviceId) {
    return res.status(400).json({ error: `Device ID is required`, deviceId, timestamp });
  }

  let RAIN_THRESHOLD_MM = parseFloat(process.env.RAIN_THRESHOLD_MM) || 3.3; 
  
  if (isNaN(RAIN_THRESHOLD_MM)) {
    console.warn(`[${timestamp}] WARNING: RAIN_THRESHOLD_MM is not a number, using default value of 3.3mm`);
    RAIN_THRESHOLD_MM = 3.3; // Default value if not set or invalid
  }

  const { OPEN_WEATHER_API_KEY, LAT, LON } = process.env;

  if (!OPEN_WEATHER_API_KEY || !LAT || !LON) {
    return res.status(500).json({ error: `Missing environment variables`, deviceId, timestamp });
  }

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${LAT}&lon=${LON}&exclude=current,minutely,hourly,alerts&appid=${OPEN_WEATHER_API_KEY}&units=metric`;


  try{
    const conn = getEweLinkCredentials();
    await conn.connect();

    if (!conn.isConnected()) {
      return res.status(500).json({ error: `Failed to connect to eWeLink`, deviceId, timestamp });
    }

    const device = await conn.getDevice(deviceId);
    if (!device) {
      return res.status(404).json({ error: `Device not found`, deviceId, timestamp });
    }

    const weather = await fetch(url);
    if (!weather.ok) {
      return res.status(500).json({ error: `Failed to fetch weather data`, deviceId, timestamp });
    }

    const weatherData = await weather.json();
    const rain = weatherData.daily?.[0]?.rain ?? 0;

    console.log(`[${timestamp}] Forecasted rain: ${rain}mm for device ${deviceId}`);


    const shouldTurnOn = rain <= RAIN_THRESHOLD_MM;
    const action = shouldTurnOn ? 'on' : 'off';

    const success = await conn.setDevicePowerState(device.deviceid, shouldTurnOn);
    if (!success) {
      return res.status(500).json({ error: `Failed to control device power state`, deviceId, timestamp });
    }

    console.log(`[${timestamp}] Device ${deviceId} turned ${action} based on weather data: ${rain}mm of rain`);
    return res.status(200).json({ message: `Device ${deviceId} turned ${action} based on weather data: ${rain}mm of rain`, deviceId, timestamp });
    
  }catch(error) {
    console.error('Error fetching weather data or controlling device:', error);
    //TODO: email error to admin or log it
    return res.status(500).json({ error: `Failed to control device based on weather data`, deviceId, timestamp });
  }
}