import exp from "constants";
import { promise as GPIO } from "rpi-gpio";
/**
LOCK_PIN = getattr(settings, 'LOCK_PIN', 4)
MAGNET_PIN = getattr(settings, 'MAGNET_PIN', 17)

PULSE_SLEEP = getattr(settings, 'PULSE_SLEEP', 1)
PULSE_ON = getattr(settings, 'PULSE_ON', 0)
PULSE_OFF = getattr(settings, 'PULSE_OFF', 1)
*/
const LOCK_PIN = 4;
const MAGNET_PIN = 17;

const PULSE_SLEEP = 1000; //1s 1000ms
const PULSE_ON = false;
const PULSE_OFF = true;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
class HpccInternal {
  constructor() {}
  async setup() {
    try {
      await GPIO.setup(LOCK_PIN, GPIO.DIR_OUT);
      await GPIO.setup(MAGNET_PIN, GPIO.DIR_IN);
      return true;
    } catch (e) {
      //console.log(e);
      return false;
    }
  }

  async send_unlock_pulse() {
    try {
      await GPIO.write(LOCK_PIN, PULSE_ON);
      await sleep(PULSE_SLEEP);
      await GPIO.write(LOCK_PIN, PULSE_OFF);
      return true;
    } catch (e) {
      //console.log(e);
      return false;
    }
  }
  async is_magnet_on() {
    try {
      const value = await GPIO.read(MAGNET_PIN);
      return value;
    } catch (e) {
      //console.log(e);
      return false;
    }
  }
}

export const hpccInternal = new HpccInternal();