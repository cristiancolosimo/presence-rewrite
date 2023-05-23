import { exec } from 'child_process';
import fs from 'fs';
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
const PULSE_ON = 0;
const PULSE_OFF = 1;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
class HpccInternal {
  constructor() {}
  async setup() {
    try {
      exec(`echo ${LOCK_PIN} > /sys/class/gpio/export`);
      exec(`echo ${MAGNET_PIN} > /sys/class/gpio/export`);
      exec(`echo ${PULSE_OFF} > /sys/class/gpio/gpio${LOCK_PIN}/value`);
      exec(`echo out > /sys/class/gpio/gpio${LOCK_PIN}/direction`);
      exec(`echo in > /sys/class/gpio/gpio${MAGNET_PIN}/direction`);
      exec(`echo ${PULSE_OFF} > /sys/class/gpio/gpio${LOCK_PIN}/value`);
      exec(`echo ${PULSE_OFF} > /sys/class/gpio/gpio${LOCK_PIN}/value`);

      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async send_unlock_pulse() {
    try {
      exec(`echo ${PULSE_ON} > /sys/class/gpio/gpio${LOCK_PIN}/value`);
      await sleep(PULSE_SLEEP);
      exec(`echo ${PULSE_OFF} > /sys/class/gpio/gpio${LOCK_PIN}/value`);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  async is_magnet_on() {
    try {
      const value = parseInt(fs.readFileSync(`/sys/class/gpio/gpio${MAGNET_PIN}/value`, {encoding:'utf8'})) 
      return !value;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}

export const hpccInternal = new HpccInternal();