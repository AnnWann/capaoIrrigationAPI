import { getEweLinkCredentials } from "../src/authEwelink";

export default async function handler(req, res) {

  const deviceId = req.query.deviceId;
  const timestamp = timestamp;

  if (!deviceId) {
    return res.status(400).json({ error: `Device ID is required`, deviceId, timestamp});
  }

  try{
    const conn = getEweLinkCredentials();
    await conn.connect();
    if (!conn.isConnected()) {
      return res.status(500).json({ error: `Failed to connect to eWeLink`, deviceId, timestamp});
    }

    const device = await conn.getDevice(deviceId);
    if (!device) {
      return res.status(404).json({ error: `Device not found`, deviceId, timestamp });
    }

    await conn.setDevicePowerState(device.deviceid, false);
    console.log(`[${timestamp}] Stopping device: ${deviceId}`);
    
    return res.status(200).json({ message: `Devicestopped successfully`, deviceId, timestamp });
  }catch(error) {
    console.error('Error stopping devices:', error);
    //TODO: email error to admin or log it
    return res.status(500).json({ error: `Failed to stop devices`, deviceId, timestamp });
  }
}