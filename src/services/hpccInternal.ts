import rpio from 'rpio';
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
const PULSE_ON = rpio.HIGH;
const PULSE_OFF = rpio.LOW;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
class HpccInternal {
  constructor() {}
  async setup() {
    try {
      rpio.open(LOCK_PIN, rpio.OUTPUT);
      rpio.open(MAGNET_PIN, rpio.INPUT);
      
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async send_unlock_pulse() {
    try {
      rpio.write(LOCK_PIN, PULSE_ON);
      await sleep(PULSE_SLEEP);
      rpio.write(LOCK_PIN, PULSE_OFF);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  async is_magnet_on() {
    try {
      const value = rpio.read(MAGNET_PIN);
      return value;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}

export const hpccInternal = new HpccInternal();