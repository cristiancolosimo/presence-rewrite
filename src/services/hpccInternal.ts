import { exportReadPin, readPin } from '../utils/gpio';
import { sleep } from '../utils/utils_function';
import { MAGNET_PIN, LOCK_PIN, PULSE_ON, PULSE_SLEEP, PULSE_OFF } from '../costants';
import { Gpio } from 'onoff';



class HpccInternal {
  LOCK_PIN_GPIO_INT : Gpio | null = null;
  constructor() {}
  async setup() {
      exportReadPin(MAGNET_PIN);
      this.LOCK_PIN_GPIO_INT = new Gpio(LOCK_PIN, 'out');
  }

  async send_unlock_pulse() {
    this.LOCK_PIN_GPIO_INT?.writeSync(PULSE_ON);
    await sleep(PULSE_SLEEP);
    this.LOCK_PIN_GPIO_INT?.writeSync(PULSE_OFF);
  }
  async is_magnet_on() {
    try{
      const value = readPin(MAGNET_PIN);
      return !value;
    }catch(e){
      console.log(e);
      return false;
    }
  }
}

export const hpccInternal = new HpccInternal();